import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { hasRole, User } from '@core/models/user.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { EmployeeFormDialogComponent } from './employee-form-dialog.component';

@Component({
  selector: 'mdp-employee-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss'],
})
export class EmployeeDetailComponent implements OnInit {
  employee: Record<string, unknown> | null = null;
  loading = true;
  canEdit = false;
  canDeactivate = false;
  employeeId!: string;

  leaveBalances: Array<{ type: string; used: number; total: number }> = [];
  quickStats = { shiftsThisMonth: 0, hoursWorked: 0, leaveUsed: 0, leaveRemaining: 0 };
  locationName = '–';
  shifts: unknown[] = [];
  shiftsLoading = false;

  constructor(
      private route: ActivatedRoute,
      private api: ApiService,
      private dialog: MatDialog,
      private store: Store,
      private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id') ?? '';

    this.store.select(selectCurrentUser).subscribe(user => {
      this.canEdit       = hasRole(user, 'MANAGER', 'HR', 'OWNER', 'IT_ADMIN');
      this.canDeactivate = hasRole(user, 'MANAGER', 'HR', 'OWNER', 'IT_ADMIN');
    });

    this.loadEmployee();
    this.loadShifts();
    this.loadLeaveBalances();
  }

  loadEmployee(): void {
      this.loading = true;
      this.api.getById<{
          id: string;
          payload: Record<string, unknown>
      }>('entities/Employee', this.employeeId)
          .pipe(catchError(() => of(null)))
          .subscribe(emp => {
              if (!emp) {
                  this.loading = false;
                  return;
              }
              emp = {id: emp.id, ...emp.payload} as any;
              this.employee = emp;
              this.loading = false;
              this.loadLocationName();
          });
  }

  loadShifts(): void {
    this.shiftsLoading = true;
    this.api.get<Array<{ id: string; payload: Record<string, unknown> }>>(`shifts/employee/${this.employeeId}`).pipe(
        catchError(() => of([]))
    ).subscribe(raw => {
      this.shifts = raw.map(s => ({
        id:        s.id,
        date:      s.payload['shiftDate'],
        startTime: (s.payload['startTime'] as string)?.substring(11, 16),
        endTime:   (s.payload['endTime']   as string)?.substring(11, 16),
        paidMinutes: s.payload['paidMinutes'] ?? '–',
        status:    s.payload['shiftStatus'],
      }));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      this.shifts = this.shifts.filter(s =>
              new Date((s as any).date) >= cutoff
      );
      const now = new Date();
      const monthShifts = this.shifts.filter(s => {
        const d = new Date((s as any).date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      this.quickStats.shiftsThisMonth = monthShifts.length;
      this.quickStats.hoursWorked = monthShifts.reduce((acc: number, s) => acc + (Number((s as any).paidMinutes) || 0), 0) / 60;
      this.shiftsLoading = false;
    });
  }

  loadLeaveBalances(): void {
      this.api.get<Array<{ type: string; used: number; total: number }>>('leaves/my/balance').pipe(
          catchError(() => of([]))
      ).subscribe(balances => {
          this.leaveBalances = balances;
          const pto = balances.find(b => b.type === 'Annual');
          if (pto) {
              this.quickStats.leaveUsed      = pto.used;
              this.quickStats.leaveRemaining = pto.total - pto.used;
          }
      });
  }

    loadLocationName(): void {
        this.api.get<Array<{ id: string; payload: { storeName: string } }>>('locations').pipe(
            catchError(() => of([]))
        ).subscribe(locations => {
            const locId = (this.employee?.['storeLocationId'] ?? this.employee?.['locationId']) as string;
            const match = locations.find(l => l.id === locId);
            this.locationName = match?.payload?.storeName ?? '–';
        });
    }

  openEditDialog(): void {
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { formData: this.employee },
    });
    ref.afterClosed().subscribe(data => {
      if (data) {
        this.api.put('entities/Employee', this.employeeId, data).subscribe(() => {
          this.notifications.success('Employee updated.');
          this.loadEmployee();
        });
      }
    });
  }

  deactivate(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Deactivate Employee',
        message: `Are you sure you want to deactivate ${this.employee?.['fullName']}?`,
        confirmText: 'Deactivate',
        confirmColor: 'warn',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.patch('entities/Employee', this.employeeId, { isActive: false }).subscribe(() => {
          this.notifications.success('Employee deactivated.');
          this.loadEmployee();
        });
      }
    });
  }

  get fullName(): string {
    if (!this.employee) return '';
    return this.employee['fullName'] as string ?? '';
  }
}