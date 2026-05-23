import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ApiService} from '@core/services/api.service';
import {NotificationService} from '@core/services/notification.service';
import {ConfirmDialogComponent} from '@shared/components/confirm-dialog/confirm-dialog.component';
import {selectCurrentUser} from '@store/auth/auth.selectors';
import {hasRole} from '@core/models/user.model';
import {ActivatedRoute} from '@angular/router';

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
    locationId: string | null = null;
    myShiftsOnly = false;
    currentUserId: string | null = null;

    constructor(
        private api: ApiService,
        private dialog: MatDialog,
        private store: Store,
        private notifications: NotificationService,
        private route: ActivatedRoute,
    ) {
    }

    ngOnInit(): void {
        this.setWeek(new Date());
        this.myShiftsOnly = this.route.snapshot.url.some(s => s.path === 'upcoming');
        this.store.select(selectCurrentUser).subscribe(user => {
            this.canEdit = hasRole(user, 'STORE_MANAGER', 'SHIFT_SUPERVISOR', 'HR_MANAGER', 'HR_MANAGER');
            this.locationId = user?.locationId ?? null;
            this.currentUserId = user?.id ?? null;
            if (this.myShiftsOnly) {
                this.employees = this.currentUserId ? [{ id: this.currentUserId, name: 'Me' }] : [];
                this.loadData();
            }
        });
        if (!this.myShiftsOnly) {
            this.loadData();
        }
    }

    setWeek(date: Date): void {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        this.weekStart = new Date(d.setDate(diff));
        this.weekDays = Array.from({length: 7}, (_, i) => {
            const wd = new Date(this.weekStart);
            wd.setDate(this.weekStart.getDate() + i);
            return wd;
        });
    }

    prevWeek(): void {
        this.setWeek(new Date(this.weekStart.getTime() - 7 * 86400000));
        this.loadData();
    }

    nextWeek(): void {
        this.setWeek(new Date(this.weekStart.getTime() + 7 * 86400000));
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        if (this.myShiftsOnly && this.currentUserId) {
            this.api.get<Array<{ id: string; payload: Record<string, unknown> }>>(
                `shifts/my/upcoming`
            ).pipe(catchError(() => of([]))).subscribe(raw => {
                this.shifts = raw.map(s => ({
                    id: s.id,
                    employeeId: this.currentUserId!,
                    employeeName: '',
                    date: s.payload['shiftDate'] as string,
                    startTime: (s.payload['startTime'] as string)?.substring(11, 16),
                    endTime:   (s.payload['endTime']   as string)?.substring(11, 16),
                    status:    s.payload['shiftStatus'] as string,
                }));
                this.loading = false;
            });
            return;
        }
        this.api.get<{ content: Array<{ id: string; payload: { fullName: string } }> }>(
            'entities/Employee?size=200'
        ).subscribe(res => {
            this.employees = (res.content ?? []).map(e => ({
                id: e.id,
                name: e.payload?.fullName ?? e.id,
            }));
        });

        const from = this.weekStart.toISOString().split('T')[0];
        const to = this.weekDays[6].toISOString().split('T')[0];

        const locationId = this.locationId ?? '10000000-0000-0000-0000-000000000001';
        this.api.get<{
            content: Array<{
                shiftId: string; employeeId: string; employeeFullName: string;
                shiftDate: string; startTime: string; endTime: string; shiftStatus: string;
            }>
        }>(`shifts/schedule/${locationId}?startDate=${from}&endDate=${to}&size=200`).pipe(
            catchError(() => of({content: []}))
        ).subscribe(page => {
            const entries = page.content ?? [];
            this.shifts = entries.map(e => ({
                id: e.shiftId,
                employeeId: e.employeeId,
                employeeName: e.employeeFullName,
                date: e.shiftDate,
                startTime: (e.startTime ?? '').substring(11, 16),
                endTime: (e.endTime ?? '').substring(11, 16),
                status: e.shiftStatus,
            }));
            this.loading = false;
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
            NO_SHOW: 'shift-noshow',
        };
        return map[status] ?? 'shift-scheduled';
    }

    formatDate(d: Date): string {
        return d.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
    }

    isToday(d: Date): boolean {
        return d.toDateString() === new Date().toDateString();
    }

    openAddShiftDialog(employeeId?: string, date?: Date): void {
        const ref = this.dialog.open(ShiftFormDialogComponent, {
            width: '480px',
            data: {employeeId: employeeId ?? null, date: date ?? new Date(), employees: this.employees},
        });
        ref.afterClosed().subscribe(formData => {
            if (formData) {
                // --- Transformation Logic ---
                const dateObj = new Date(formData.date);
                const shiftDate = dateObj.toISOString().split('T')[0]; // "YYYY-MM-DD"

                const payload = {
                    employeeId: formData.employeeId,
                    storeLocationId: this.locationId ?? '10000000-0000-0000-0000-000000000001',
                    shiftDate: shiftDate,
                    startTime: `${shiftDate}T${formData.startTime}:00`,
                    endTime: `${shiftDate}T${formData.endTime}:00`
                };

                this.api.post('hr/shifts', payload).pipe(
                    catchError(() => of(null))
                ).subscribe(() => {
                    this.notifications.success('Shift scheduled.');
                    this.loadData();
                });
            }
        });
    }

    cancelShift(shiftId: string): void {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Cancel Shift',
                message: 'Cancel this shift?',
                confirmText: 'Cancel Shift',
                confirmColor: 'warn'
            },
        });
        ref.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.api.patch('hr/shifts', shiftId + '/cancel', {}).pipe(catchError(() => of(null))).subscribe(() => {
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

@Component({
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
        @Inject(MAT_DIALOG_DATA) public data: {
            employeeId: string | null;
            date: Date;
            employees: Array<{ id: string; name: string }>
        },
        private fb: FormBuilder,
    ) {
    }

    ngOnInit(): void {
        this.form = this.fb.group({
            employeeId: [this.data.employeeId, Validators.required],
            date: [this.data.date, Validators.required],
            startTime: ['08:00', Validators.required],
            endTime: ['16:00', Validators.required],
            notes: [''],
        });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.ref.close(this.form.value);
    }
}