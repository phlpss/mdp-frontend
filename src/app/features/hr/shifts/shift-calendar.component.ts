import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { hasRole } from '../../../core/models/user.model';

interface ShiftCell {
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  id?: string;
}

@Component({
  selector: 'mdp-shift-calendar',
  templateUrl: './shift-calendar.component.html',
  styleUrls: ['./shift-calendar.component.scss'],
})
export class ShiftCalendarComponent implements OnInit {
  weekStart!: Date;
  weekDays: Date[] = [];
  employees: Array<{ id: string; name: string }> = [];
  shifts: ShiftCell[] = [];
  loading = false;
  canEdit = false;

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private store: Store,
    private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.setWeek(new Date());
    this.store.select(selectCurrentUser).subscribe(user => {
      this.canEdit = hasRole(user, 'MANAGER', 'SUPERVISOR', 'HR', 'OWNER', 'IT_ADMIN');
    });
    this.loadData();
  }

  setWeek(date: Date): void {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    this.weekStart = new Date(d.setDate(diff));
    this.weekDays  = Array.from({ length: 7 }, (_, i) => {
      const wd = new Date(this.weekStart);
      wd.setDate(this.weekStart.getDate() + i);
      return wd;
    });
  }

  prevWeek(): void { this.setWeek(new Date(this.weekStart.getTime() - 7 * 86400000)); this.loadData(); }
  nextWeek(): void { this.setWeek(new Date(this.weekStart.getTime() + 7 * 86400000)); this.loadData(); }

  loadData(): void {
    this.loading = true;
    const from = this.weekStart.toISOString().split('T')[0];
    const to   = this.weekDays[6].toISOString().split('T')[0];

    this.api.get<{ employees: Array<{ id: string; name: string }>; shifts: ShiftCell[] }>(
      `shifts/week?from=${from}&to=${to}`
    ).pipe(
      catchError(() => of({
        employees: [
          { id: '1', name: 'Alice Johnson' },
          { id: '2', name: 'Bob Smith' },
          { id: '3', name: 'Carol White' }
        ],
        shifts: [] as ShiftCell[],
      }))
    ).subscribe(data => {
      this.employees = data.employees;
      this.shifts    = data.shifts;
      this.loading   = false;
    });
  }

  getShiftsForCell(employeeId: string, date: Date): ShiftCell[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.shifts.filter(s => s.employeeId === employeeId && s.date === dateStr);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: 'shift-scheduled',
      COMPLETED: 'shift-completed',
      CANCELLED: 'shift-cancelled',
      NO_SHOW:   'shift-noshow',
    };
    return map[status] ?? 'shift-scheduled';
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  isToday(d: Date): boolean {
    return d.toDateString() === new Date().toDateString();
  }

  openAddShiftDialog(employeeId?: string, date?: Date): void {
    const ref = this.dialog.open(ShiftFormDialogComponent, {
      width: '480px',
      data: { employeeId: employeeId ?? null, date: date ?? new Date(), employees: this.employees },
    });
    ref.afterClosed().subscribe(data => {
      if (data) {
        this.api.post('hr/shifts', data).pipe(catchError(() => of(null))).subscribe(() => {
          this.notifications.success('Shift scheduled.');
          this.loadData();
        });
      }
    });
  }

  cancelShift(shiftId: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancel Shift', message: 'Cancel this shift?', confirmText: 'Cancel Shift', confirmColor: 'warn' },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.patch('hr/shifts', shiftId, {}).pipe(catchError(() => of(null))).subscribe(() => {
          this.notifications.success('Shift cancelled.');
          this.loadData();
        });
      }
    });
  }

  goToToday(): void {
    this.setWeek(new Date());
    this.loadData();
  }
}

// ── Inline dialog ──────────────────────────────────────────────────────────────
import { Component as Comp } from '@angular/core';

@Comp({
  selector: 'mdp-shift-form-dialog',
  template: `
    <h2 mat-dialog-title>Schedule Shift</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:12px;padding-top:8px">
        <mat-form-field appearance="outline">
          <mat-label>Employee</mat-label>
          <mat-select formControlName="employeeId">
            <mat-option *ngFor="let e of data.employees" [value]="e.id">{{ e.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="dp" formControlName="date">
          <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
          <mat-datepicker #dp></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Start Time</mat-label>
          <input matInput type="time" formControlName="startTime">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>End Time</mat-label>
          <input matInput type="time" formControlName="endTime">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(null)">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Schedule Shift</button>
    </mat-dialog-actions>
  `,
})
export class ShiftFormDialogComponent implements OnInit {
  form!: FormGroup;
  constructor(
      public ref: MatDialogRef<ShiftFormDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { employeeId: string | null; date: Date; employees: Array<{ id: string; name: string }> },
      private fb: FormBuilder,
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      employeeId: [this.data.employeeId, Validators.required],
      date:       [this.data.date,       Validators.required],
      startTime:  ['08:00',              Validators.required],
      endTime:    ['16:00',              Validators.required],
      notes:      [''],
    });
  }
  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.ref.close(this.form.value);
  }
}