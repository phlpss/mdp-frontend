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
          });
  }

  loadShifts(): void {
    this.shiftsLoading = true;
    this.api.get<Array<{ id: string; payload: Record<string, unknown> }>>(`shifts/employee/${this.employeeId}`).pipe(
        catchError(() => of([]))
    ).subscribe(shifts => {
      this.shifts = shifts.map(s => ({
        id: s.id,
        date: s.payload['shiftDate'],
        startTime: (s.payload['startTime'] as string)?.substring(11, 16),
        endTime:   (s.payload['endTime']   as string)?.substring(11, 16),
        status:    s.payload['shiftStatus'],
      }));
      this.shiftsLoading = false;
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