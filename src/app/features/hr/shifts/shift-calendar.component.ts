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

/** Extracts HH:MM from an ISO datetime string ('2026-04-22T07:00:00') or a plain time ('07:00'). */
function parseTime(value: string | null | undefined): string {
    if (!value) return '';
    const t = value.includes('T') ? value.split('T')[1] : value;
    return t.substring(0, 5);   // HH:MM
}

/** Formats a Date as 'YYYY-MM-DD' using local time (avoids UTC-shift from toISOString()). */
function toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

interface ShiftCell {
    employeeId: string;
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    id?: string;
}

interface CalendarDay {
    date: Date;
    inMonth: boolean;
}

@Component({
    selector: 'mdp-shift-calendar',
    templateUrl: './shift-calendar.component.html',
    styleUrls: ['./shift-calendar.component.scss'],
})
export class ShiftCalendarComponent implements OnInit {
    // ── shared state ──────────────────────────────────────────────────────────
    shifts: ShiftCell[] = [];
    loading = false;
    canEdit = false;
    locationId: string | null = null;
    myShiftsOnly = false;
    currentUserId: string | null = null;

    // ── weekly view state (HR / manager) ──────────────────────────────────────
    weekStart!: Date;
    weekDays: Date[] = [];
    employees: Array<{ id: string; name: string }> = [];

    // ── monthly view state (individual employee) ──────────────────────────────
    viewMonth!: Date;
    calendarGrid: CalendarDay[][] = [];
    readonly dowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    constructor(
        private api: ApiService,
        private dialog: MatDialog,
        private store: Store,
        private notifications: NotificationService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.myShiftsOnly = this.route.snapshot.url.some(s => s.path === 'upcoming')
            || this.route.snapshot.url.some(s => s.path === 'my');

        // Initialise both view states so switching route doesn't break anything
        this.setWeek(new Date());
        this.viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        this.buildCalendarGrid();

        this.store.select(selectCurrentUser).subscribe(user => {
            this.canEdit = hasRole(user, 'STORE_MANAGER', 'SHIFT_SUPERVISOR', 'HR_MANAGER', 'IT_SPECIALIST');
            this.locationId = user?.locationId ?? null;
            this.currentUserId = user?.id ?? null;
            if (this.myShiftsOnly) {
                this.employees = this.currentUserId
                    ? [{ id: this.currentUserId, name: 'Me' }]
                    : [];
            }
            this.loadData();
        });
    }

    // ── monthly navigation ────────────────────────────────────────────────────

    buildCalendarGrid(): void {
        const year = this.viewMonth.getFullYear();
        const month = this.viewMonth.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        // Monday-first: (getDay() + 6) % 7  →  Mon=0 … Sun=6
        const startDow = (firstOfMonth.getDay() + 6) % 7;

        this.calendarGrid = Array.from({length: 6}, (_, w) => {
            const week = Array.from({length: 7}, (_, d) => {
                const offset = w * 7 + d - startDow;
                const date = new Date(year, month, 1 + offset);
                return {date, inMonth: date.getMonth() === month};
            });
            return week;
        }).filter((week, wi) =>
            // Remove the 6th week if it lies entirely outside the month
            wi < 5 || week.some(day => day.inMonth)
        );
    }

    prevMonth(): void {
        this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() - 1, 1);
        this.buildCalendarGrid();
        this.loadData();
    }

    nextMonth(): void {
        this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + 1, 1);
        this.buildCalendarGrid();
        this.loadData();
    }

    getShiftForDay(date: Date): ShiftCell | null {
        const key = toDateKey(date);
        return this.shifts.find(s => s.date === key) ?? null;
    }

    // ── weekly navigation (HR view) ───────────────────────────────────────────

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

    goToToday(): void {
        if (this.myShiftsOnly) {
            this.viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            this.buildCalendarGrid();
        } else {
            this.setWeek(new Date());
        }
        this.loadData();
    }

    // ── data loading ──────────────────────────────────────────────────────────

    loadData(): void {
        this.loading = true;

        if (this.myShiftsOnly && this.currentUserId) {
            // Fetch this employee's shifts (includes past COMPLETED + future SCHEDULED)
            this.api.get<Array<{id: string; payload: Record<string, unknown>}>>(
                `shifts/employee/${this.currentUserId}`
            ).pipe(catchError(() => of([]))).subscribe(raw => {
                this.shifts = raw.map(s => ({
                    id:           s.id,
                    employeeId:   this.currentUserId!,
                    employeeName: '',
                    date:         (s.payload['shiftDate'] as string)?.substring(0, 10) ?? '',
                    startTime:    parseTime(s.payload['startTime'] as string),
                    endTime:      parseTime(s.payload['endTime']   as string),
                    status:       s.payload['shiftStatus'] as string,
                }));
                this.loading = false;
            });
            return;
        }

        // ── HR / manager weekly view ──────────────────────────────────────────
        this.api.get<{content: Array<{id: string; payload: {fullName: string}}>}>(
            'entities/Employee?size=200'
        ).subscribe(res => {
            this.employees = (res.content ?? []).map(e => ({
                id:   e.id,
                name: e.payload?.fullName ?? e.id,
            }));
        });

        const from = this.weekStart.toISOString().split('T')[0];
        const to   = this.weekDays[6].toISOString().split('T')[0];
        const locationId = this.locationId ?? '10000000-0000-0000-0000-000000000001';

        this.api.get<{
            content: Array<{
                shiftId: string; employeeId: string; employeeFullName: string;
                shiftDate: string; startTime: string; endTime: string; shiftStatus: string;
            }>
        }>(`shifts/schedule/${locationId}?startDate=${from}&endDate=${to}&size=200`).pipe(
            catchError(() => of({content: []}))
        ).subscribe(page => {
            this.shifts = (page.content ?? []).map(e => ({
                id:           e.shiftId,
                employeeId:   e.employeeId,
                employeeName: e.employeeFullName,
                date:         e.shiftDate?.substring(0, 10),
                startTime:    parseTime(e.startTime),
                endTime:      parseTime(e.endTime),
                status:       e.shiftStatus,
            }));
            this.loading = false;
        });
    }

    getShiftsForCell(employeeId: string, date: Date): ShiftCell[] {
        const dateStr = toDateKey(date);
        return this.shifts.filter(s => s.employeeId === employeeId && s.date === dateStr);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

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
        return d.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
    }

    isToday(d: Date): boolean {
        return d.toDateString() === new Date().toDateString();
    }

    isCurrentMonth(d: Date): boolean {
        return d.getMonth() === this.viewMonth.getMonth()
            && d.getFullYear() === this.viewMonth.getFullYear();
    }

    openAddShiftDialog(employeeId?: string, date?: Date): void {
        const ref = this.dialog.open(ShiftFormDialogComponent, {
            width: '480px',
            data: {mode: 'create', employeeId: employeeId ?? null, date: date ?? new Date(), employees: this.employees},
        });
        ref.afterClosed().subscribe(formData => {
            if (!formData) return;
            const shiftDate = new Date(formData.date).toISOString().split('T')[0];
            const payload = {
                employeeId: formData.employeeId,
                storeLocationId: this.locationId ?? '10000000-0000-0000-0000-000000000001',
                shiftDate,
                startTime: `${shiftDate}T${formData.startTime}:00`,
                endTime: `${shiftDate}T${formData.endTime}:00`,
            };
            this.api.post('hr/shifts', payload).pipe(catchError(() => of(null)))
                .subscribe(() => {
                    this.notifications.success('Shift scheduled.');
                    this.loadData();
                });
        });
    }

    editShift(shift: ShiftCell): void {
        if (shift.status !== 'SCHEDULED') {
            this.notifications.error('Only scheduled shifts can be edited.');
            return;
        }
        const ref = this.dialog.open(ShiftFormDialogComponent, {
            width: '480px',
            data: {
                mode: 'edit',
                employeeId: shift.employeeId,
                date: new Date(shift.date),
                startTime: shift.startTime || '08:00',
                endTime: shift.endTime || '16:00',
                employees: this.employees,
            },
        });
        ref.afterClosed().subscribe(formData => {
            if (!formData) return;
            const shiftDate = new Date(formData.date).toISOString().split('T')[0];
            const body = {
                shiftDate,
                startTime: `${shiftDate}T${formData.startTime}:00`,
                endTime: `${shiftDate}T${formData.endTime}:00`,
            };
            this.api.put('hr/shifts', shift.id!, body).pipe(catchError(() => of(null)))
                .subscribe(() => {
                    this.notifications.success('Shift updated.');
                    this.loadData();
                });
        });
    }

    renewShift(shift: ShiftCell): void {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {title: 'Renew Shift', message: 'Restore this cancelled shift to scheduled?', confirmText: 'Renew'},
        });
        ref.afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.api.patch('hr/shifts', shift.id + '/renew', {}).pipe(catchError(() => of(null)))
                .subscribe((res) => {
                    if (res) {
                        this.notifications.success('Shift renewed.');
                        this.loadData();
                    } else {
                        this.notifications.error('Could not renew (only upcoming cancelled shifts can be renewed).');
                    }
                });
        });
    }

    openShiftDialog(shift: ShiftCell): void {
        const ref = this.dialog.open(ShiftFormDialogComponent, {
            width: '480px',
            data: {
                mode: 'edit',
                status: shift.status,
                canRenew: shift.status === 'CANCELLED' && this.isUpcoming(shift),
                canCancel: shift.status === 'SCHEDULED',
                editable: shift.status === 'SCHEDULED',
                employeeId: shift.employeeId,
                date: new Date(shift.date),
                startTime: shift.startTime || '08:00',
                endTime: shift.endTime || '16:00',
                employees: this.employees,
            },
        });
        ref.afterClosed().subscribe((result: any) => {
            if (!result) return;

            if (result.action === 'cancel') {
                this.api.patch('hr/shifts', shift.id + '/cancel', {}).pipe(catchError(() => of(null)))
                    .subscribe(() => { this.notifications.success('Shift cancelled.'); this.loadData(); });
                return;
            }
            if (result.action === 'renew') {
                this.api.patch('hr/shifts', shift.id + '/renew', {}).pipe(catchError(() => of(null)))
                    .subscribe(res => {
                        if (res) { this.notifications.success('Shift renewed.'); this.loadData(); }
                        else { this.notifications.error('Could not renew (only upcoming cancelled shifts can be renewed).'); }
                    });
                return;
            }
            // action === 'save'
            const shiftDate = new Date(result.date).toISOString().split('T')[0];
            const body = {
                shiftDate,
                startTime: `${shiftDate}T${result.startTime}:00`,
                endTime:   `${shiftDate}T${result.endTime}:00`,
            };
            this.api.put('hr/shifts', shift.id!, body).pipe(catchError(() => of(null)))
                .subscribe(() => { this.notifications.success('Shift updated.'); this.loadData(); });
        });
    }

    isUpcoming(shift: ShiftCell): boolean {
        return shift.date >= toDateKey(new Date());
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
                this.api.patch('hr/shifts', shiftId + '/cancel', {}).pipe(catchError(() => of(null)))
                    .subscribe(() => {
                        this.notifications.success('Shift cancelled.');
                        this.loadData();
                    });
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
    selector: 'mdp-shift-form-dialog',
    template: `
        <h2 mat-dialog-title>{{ data.mode === 'edit' ? 'Shift Details' : 'Schedule Shift' }}</h2>
        <mat-dialog-content>
            <div *ngIf="data.mode === 'edit'" class="status-line">
                Status: <strong>{{ data.status }}</strong>
            </div>
            <form [formGroup]="form" style="display:flex;flex-direction:column;gap:12px;padding-top:8px">
                <mat-form-field appearance="outline">
                    <mat-label>Employee</mat-label>
                    <mat-select formControlName="employeeId" [disabled]="data.mode === 'edit'">
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
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="ref.close(null)">Close</button>
            <button *ngIf="data.canCancel" mat-button color="warn" (click)="ref.close({ action: 'cancel' })">Cancel Shift</button>
            <button *ngIf="data.canRenew" mat-button color="primary" (click)="ref.close({ action: 'renew' })">Renew Shift</button>
            <button *ngIf="data.mode === 'create' || data.editable" mat-raised-button color="primary" (click)="submit()">
                {{ data.mode === 'edit' ? 'Save Changes' : 'Schedule Shift' }}
            </button>
        </mat-dialog-actions>
    `,
})
export class ShiftFormDialogComponent implements OnInit {
    form!: FormGroup;

    constructor(
        public ref: MatDialogRef<ShiftFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            mode: 'create' | 'edit';
            status?: string;
            canCancel?: boolean;
            canRenew?: boolean;
            editable?: boolean;
            employeeId: string | null;
            date: Date;
            startTime?: string;
            endTime?: string;
            employees: Array<{ id: string; name: string }>;
        },
        private fb: FormBuilder,
    ) {}

    ngOnInit(): void {
        const disabled = this.data.mode === 'edit' && !this.data.editable;
        this.form = this.fb.group({
            employeeId: [{ value: this.data.employeeId, disabled: this.data.mode === 'edit' }, Validators.required],
            date:       [{ value: this.data.date, disabled }, Validators.required],
            startTime:  [{ value: this.data.startTime ?? '08:00', disabled }, Validators.required],
            endTime:    [{ value: this.data.endTime ?? '16:00', disabled }, Validators.required],
        });
    }

    submit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.ref.close({ action: 'save', ...this.form.getRawValue() });
    }
}