import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { ApiService } from '../../../core/services/api.service';
import { KpiData } from '../../../core/models/api.model';
import { User } from '../../../core/models/user.model';

interface UpcomingShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  locationName?: string;
}

interface LeaveBalance {
  type: string;
  used: number;
  total: number;
}

@Component({
  selector: 'mdp-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss'],
})
export class EmployeeDashboardComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  upcomingShifts$!: Observable<UpcomingShift[]>;
  leaveBalances$!: Observable<LeaveBalance[]>;
  kpis$!: Observable<KpiData[]>;

  constructor(private store: Store, private api: ApiService) {}

  ngOnInit(): void {
    this.currentUser$ = this.store.select(selectCurrentUser);

    this.upcomingShifts$ = this.api.get<{ id: string; payload: { shiftDate: string; startTime: string; endTime: string; shiftStatus: string } }[]>('shifts/my/upcoming').pipe(
      map(items => items
        .map(item => ({
          id: item.id,
          date: (item.payload.shiftDate ?? '').substring(0, 10),
          startTime: (item.payload.startTime ?? '').substring(11, 16),
          endTime: (item.payload.endTime ?? '').substring(11, 16),
          status: item.payload.shiftStatus,
        }))
        .filter(shift =>
          !!shift.date &&
          new Date(shift.date) >= new Date(new Date().toDateString()) &&
          shift.status !== 'COMPLETED' &&
          shift.status !== 'CANCELLED'
        )
      ),
      catchError(() => of([]))
    );

    this.leaveBalances$ = this.currentUser$.pipe(
      switchMap(user => {
        if (!user?.id) return of<LeaveBalance[]>([]);
        return this.api.get<LeaveBalance[]>('leaves/balance', { employeeId: user.id });
      }),
      catchError(() => of([
        { type: 'Annual', used: 5, total: 20 },
        { type: 'Sick',   used: 2, total: 10 },
      ]))
    );

    this.kpis$ = combineLatest([this.upcomingShifts$, this.leaveBalances$]).pipe(
      map(([shifts, balances]) => [
        {
          label: 'Upcoming Shifts',
          value: shifts.length,
          icon: 'schedule',
          color: '#1976d2',
        },
        {
          label: 'Annual Leave Remaining',
          value: balances.find(b => b.type === 'Annual')
            ? (balances.find(b => b.type === 'Annual')!.total - balances.find(b => b.type === 'Annual')!.used)
            : 0,
          icon: 'event_available',
          color: '#388e3c',
        },
        {
          label: 'Hours This Week',
          value: shifts.reduce((acc, s) => {
            const [sh, sm] = s.startTime.split(':').map(Number);
            const [eh, em] = s.endTime.split(':').map(Number);
            return acc + (eh * 60 + em - (sh * 60 + sm)) / 60;
          }, 0).toFixed(1),
          unit: 'hrs',
          icon: 'timer',
          color: '#f57c00',
        },
      ])
    );
  }

  getShiftStatusClass(status: string): string {
    const map: Record<string, string> = {
      SCHEDULED: 'badge-active',
      COMPLETED: 'badge-approved',
      CANCELLED: 'badge-rejected',
      NO_SHOW:   'badge-pending',
    };
    return map[status] ?? 'badge-inactive';
  }
}
