import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
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
          { id: '3', name: 'Carol White' },
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
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }
}
