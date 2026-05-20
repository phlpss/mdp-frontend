import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FilterParams } from '../../../core/models/api.model';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { hasRole, User } from '../../../core/models/user.model';
import { TableAction } from '../../../shared/components/entity-table/entity-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmployeeFormDialogComponent } from './employee-form-dialog.component';

@Component({
  selector: 'mdp-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss'],
})
export class EmployeeListComponent implements OnInit {
  filters: FilterParams = {};
  currentUser$!: Observable<User | null>;
  canAdd = false;
  reloadTrigger = 0;

  tableActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'View',
      handler: (row) => this.router.navigate(['/hr/employees', (row as { id: string }).id]),
    },
    {
      icon: 'edit',
      label: 'Edit',
      handler: (row) => this.openEditDialog(row as Record<string, unknown>),
    },
  ];

  constructor(
      private store: Store,
      private dialog: MatDialog,
      private router: Router,
      private api: ApiService,
      private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.store.select(selectCurrentUser).subscribe(user => {
      this.canAdd = hasRole(user, 'HR', 'IT_ADMIN');
    });
  }

  onFiltersChange(filters: FilterParams): void {
    this.filters = filters;
  }

  openAddDialog(): void {
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { formData: null },
    });
    ref.afterClosed().subscribe(data => {
      if (data) {
        this.api.post('entities/Employee', data).subscribe(() => {
          this.notifications.success('Employee created.');
          this.reloadTrigger++;
        });
      }
    });
  }

  openEditDialog(employee: Record<string, unknown>): void {
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { formData: employee },
    });
    ref.afterClosed().subscribe(data => {
      if (data && employee['id']) {
        this.api.put('entities/Employee', String(employee['id']), data).subscribe(() => {
          this.notifications.success('Employee updated.');
          this.reloadTrigger++;
        });
      }
    });
  }

  onRowClick(row: unknown): void {
    this.router.navigate(['/hr/employees', (row as { id: string }).id]);
  }
}