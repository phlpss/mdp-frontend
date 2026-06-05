import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { hasRole, User, UserRole } from '@core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  children?: NavItem[];
  divider?: boolean;
}

const ALL_NAV: NavItem[] = [
  { label: 'Dashboard',      icon: 'dashboard',        route: '/dashboard' },
  { label: 'My Shifts',      icon: 'schedule',         route: '/hr/shifts/my/upcoming',   roles: ['BARISTA','CASHIER','EMPLOYEE'] },
  { label: 'My Leaves',      icon: 'event_busy',       route: '/hr/leaves/my',            roles: ['BARISTA','CASHIER','EMPLOYEE'] },
  { label: 'POS',            icon: 'point_of_sale',    route: '/finance/transactions',    roles: ['CASHIER'] },
  // HR / Manager section
  { label: 'Employees',      icon: 'people',           route: '/hr/employees',            roles: ['STORE_MANAGER','SHIFT_SUPERVISOR','HR_MANAGER','BUSINESS_OWNER','IT_SPECIALIST'], divider: true },
  { label: 'Shifts',         icon: 'calendar_today',   route: '/hr/shifts',               roles: ['STORE_MANAGER','SHIFT_SUPERVISOR','HR_MANAGER','BUSINESS_OWNER','IT_SPECIALIST'] },
  { label: 'Leave Approvals',icon: 'approval',         route: '/hr/leaves',               roles: ['STORE_MANAGER','SHIFT_SUPERVISOR','HR_MANAGER','BUSINESS_OWNER','IT_SPECIALIST'] },
  // Finance section
  { label: 'Transactions',   icon: 'receipt',          route: '/finance/transactions',    roles: ['STORE_MANAGER','ACCOUNTANT','BUSINESS_OWNER','IT_SPECIALIST'], divider: true },
  { label: 'Expenses',       icon: 'receipt_long',     route: '/finance/expenses',        roles: ['STORE_MANAGER','ACCOUNTANT','BUSINESS_OWNER','IT_SPECIALIST'] },
  { label: 'Closing Report', icon: 'summarize',        route: '/finance/closing-report',  roles: ['STORE_MANAGER', 'SHIFT_SUPERVISOR'] },
  { label: 'Inventory',      icon: 'inventory_2',      route: '/finance/inventory',       roles: ['STORE_MANAGER','ACCOUNTANT','BUSINESS_OWNER','IT_SPECIALIST'] },
  { label: 'Payroll',        icon: 'payments',         route: '/finance/payroll',         roles: ['ACCOUNTANT'] },
  { label: 'Forecast',       icon: 'trending_up',      route: '/finance/forecast',        roles: ['ACCOUNTANT','BUSINESS_OWNER','STORE_MANAGER'] },
  // Admin section
  { label: 'Locations',      icon: 'store',            route: '/admin/locations', roles: ['BUSINESS_OWNER','IT_SPECIALIST','STORE_MANAGER'], divider: true },
  { label: 'Metadata Studio',icon: 'schema',           route: '/admin/metadata',  roles: ['IT_SPECIALIST'] },
];

@Component({
  selector: 'mdp-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input() opened = true;

  navItems$!: Observable<NavItem[]>;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.navItems$ = this.store.select(selectCurrentUser).pipe(
      map(user => this.filterByRole(user))
    );
  }

  private filterByRole(user: User | null): NavItem[] {
    return ALL_NAV.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return hasRole(user, ...item.roles);
    });
  }
}
