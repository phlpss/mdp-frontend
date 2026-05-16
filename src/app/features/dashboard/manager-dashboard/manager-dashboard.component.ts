import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { KpiData } from '../../../core/models/api.model';
import { selectActiveLocationId } from '../../../store/auth/auth.selectors';

interface Alert {
  type: 'warning' | 'info' | 'error';
  icon: string;
  message: string;
  action?: string;
  actionRoute?: string;
}

interface PendingApproval {
  id: string;
  employeeName: string;
  type: string;
  date: string;
  status: string;
}

@Component({
  selector: 'mdp-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
})
export class ManagerDashboardComponent implements OnInit {
  kpis$!: Observable<KpiData[]>;
  alerts$!: Observable<Alert[]>;
  pendingApprovals$!: Observable<PendingApproval[]>;
  activeLocationId$!: Observable<string | null>;
  todayDate = new Date();

  constructor(private store: Store, private api: ApiService) {}

  ngOnInit(): void {
    this.activeLocationId$ = this.store.select(selectActiveLocationId);

    this.kpis$ = this.api.get<KpiData[]>('dashboard/manager/kpis').pipe(
      catchError(() => of([
        { label: "Today's Revenue",   value: '$1,240',  change: 8.5,  changeType: 'increase' as const, icon: 'attach_money', color: '#388e3c' },
        { label: 'Transactions',      value: 47,        change: 3,    changeType: 'increase' as const, icon: 'receipt',      color: '#1976d2' },
        { label: 'Staff On Shift',    value: 6,         icon: 'people',                       color: '#f57c00' },
        { label: 'Pending Approvals', value: 3,         icon: 'pending_actions',              color: '#7b1fa2' },
        { label: 'Low Stock Items',   value: 2,         icon: 'warning',                      color: '#e53935' },
        { label: 'Open Shifts',       value: 1,         icon: 'event_note',                   color: '#0288d1' },
      ]))
    );

    this.alerts$ = this.api.get<Alert[]>('dashboard/manager/alerts').pipe(
      catchError(() => of([
        { type: 'error' as const,   icon: 'inventory_2', message: '2 inventory items are below reorder level.', action: 'View Inventory', actionRoute: '/finance/inventory' },
        { type: 'warning' as const, icon: 'pending',     message: '3 leave requests awaiting approval.',         action: 'Review',         actionRoute: '/hr/leaves' },
        { type: 'info' as const,    icon: 'schedule',    message: '1 open shift for tomorrow needs coverage.',   action: 'Assign',         actionRoute: '/hr/shifts' },
      ]))
    );

    this.pendingApprovals$ = this.api.get<PendingApproval[]>('leave-requests?status=PENDING&size=5').pipe(
      catchError(() => of([]))
    );
  }

  getAlertClass(type: string): string {
    return `alert-${type}`;
  }
}
