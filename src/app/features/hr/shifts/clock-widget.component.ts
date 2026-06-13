import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription, timer} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {ApiService} from '@core/services/api.service';
import {NotificationService} from '@core/services/notification.service';
import {selectCurrentUser} from '@store/auth/auth.selectors';
import {User} from '@core/models/user.model';

interface ShiftRow {
    id: string;
    payload: Record<string, any>;
}

@Component({
    selector: 'mdp-clock-widget',
    templateUrl: './clock-widget.component.html',
    styleUrls: ['./clock-widget.component.scss'],
})
export class ClockWidgetComponent implements OnInit, OnDestroy {
    user: User | null = null;
    loading = true;
    busy = false;
    eligible = false;

    activeShift: ShiftRow | null = null;   // the current ACTIVE shift, if any
    elapsed = '00:00:00';
    now = new Date();

    employeeId: string | null = null;
    locationId: string | null = null;

    private ticker?: Subscription;
    private userSub?: Subscription;

    constructor(
        private api: ApiService,
        private store: Store,
        private notifications: NotificationService,
    ) {
    }

    ngOnInit(): void {
        this.userSub = this.store.select(selectCurrentUser).subscribe(u => {
            this.user = u;
            const empId = (u as any)?.employeeId ?? u?.id ?? null;
            if (!empId) {
                this.loading = false;
                return;
            }
            this.api.getById<{ id: string; payload: Record<string, any> }>('entities/Employee', empId).pipe(
                catchError(() => of(null))
            ).subscribe(emp => {
                this.employeeId = emp?.id ?? empId;
                this.locationId = emp?.payload?.['locationId'] ?? null;
                this.eligible   = this.computeEligible(emp?.payload);
                if (this.eligible) {
                    this.refresh();
                } else {
                    this.loading = false;
                }
            });
        });
    }

    private computeEligible(payload: Record<string, any> | undefined): boolean {
        const pay  = String(payload?.['paymentType'] ?? '').toUpperCase();
        const empl = String(payload?.['employmentType'] ?? '').toUpperCase();
        // hourly pay OR part-time → time-tracked; fixed/monthly full-time → not
        return pay.includes('HOUR') || empl.includes('PART');
    }

    ngOnDestroy(): void {
        this.ticker?.unsubscribe();
        this.userSub?.unsubscribe();
    }

    get isClockedIn(): boolean {
        return !!this.activeShift;
    }

    get locationMissing(): boolean {
        return !this.locationId;
    }

    private refresh(): void {
        if (!this.employeeId) {
            this.loading = false;
            return;
        }
        this.loading = true;
        this.api.get<ShiftRow[]>(`shifts/employee/${this.employeeId}`).pipe(
            catchError(() => of([] as ShiftRow[]))
        ).subscribe(rows => {
            this.activeShift = (rows ?? []).find(r => r.payload?.['shiftStatus'] === 'ACTIVE') ?? null;
            this.loading = false;
            this.updateElapsed();
        });
    }

    private updateElapsed(): void {
        const start = this.activeShift?.payload?.['clockInTime'];
        if (!start) {
            this.elapsed = '00:00:00';
            return;
        }
        const ms = this.now.getTime() - new Date(start).getTime();
        if (ms < 0) {
            this.elapsed = '00:00:00';
            return;
        }
        const s = Math.floor(ms / 1000);
        const hh = String(Math.floor(s / 3600)).padStart(2, '0');
        const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        this.elapsed = `${hh}:${mm}:${ss}`;
    }

    clockIn(): void {
        if (!this.employeeId || this.busy) return;
        if (!this.eligible) {
            this.notifications.error('Time tracking does not apply to salaried employees.');
            return;
        }
        if (this.locationMissing) {
            this.notifications.error('No location is assigned to your employee record. Contact your manager.');
            return;
        }
        this.busy = true;
        this.api.post('hr/clock-in', {
            employeeId: this.employeeId,
            storeLocationId: this.locationId,
        }).pipe(
            catchError(err => {
                const msg = err?.error?.message ?? err?.error?.error ??
                    (err?.status === 409 ? 'You are already clocked in at a different location.' : 'Clock-in failed.');
                this.notifications.error(msg);
                return of(null);
            })
        ).subscribe(res => {
            this.busy = false;
            if (res) {
                this.notifications.success('Clocked in.');
                this.refresh();
            }
        });
    }

    clockOut(): void {
        if (!this.activeShift || this.busy) return;
        this.busy = true;
        this.api.post('hr/clock-out', {shiftId: this.activeShift.id}).pipe(
            catchError(err => {
                this.notifications.error(err?.error?.message ?? err?.error?.error ?? 'Clock-out failed.');
                return of(null);
            })
        ).subscribe((res: any) => {
            this.busy = false;
            if (res) {
                const paid = res?.payload?.paidMinutes;
                this.notifications.success(
                    paid != null ? `Clocked out. Paid time: ${Math.floor(paid / 60)}h ${paid % 60}m.` : 'Clocked out.'
                );
                this.refresh();
            }
        });
    }
}