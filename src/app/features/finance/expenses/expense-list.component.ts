import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { FilterParams, KpiData } from '@core/models/api.model';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { hasRole } from '@core/models/user.model';
import { TableAction } from '@shared/components/entity-table/entity-table.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'mdp-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
})
export class ExpenseListComponent implements OnInit {
  filters: FilterParams = {};
  canAdd = false;
  canApprove = false;
  reloadTrigger = 0;
  totalKpi: KpiData = { label: 'Total Expenses (Month)', value: '$0', icon: 'receipt_long', color: '#e53935' };
  tableActions: TableAction[] = [];

  constructor(
      private store: Store,
      private dialog: MatDialog,
      private api: ApiService,
      private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser).subscribe(user => {
      this.canAdd = hasRole(user, 'MANAGER', 'SUPERVISOR');
      this.canApprove = hasRole(user, 'ACCOUNTANT');

      if (this.canApprove) {
        this.tableActions = [
          {
            icon: 'check_circle', label: 'Approve', color: 'primary',
            hidden: (row) => !!(row as { approvedBy: unknown }).approvedBy,
            handler: (row) => this.approve(row as { id: string }),
          },
        ];
      }
      if (this.canAdd) {
        this.tableActions.push({
          icon: 'edit', label: 'Edit', handler: (row) => this.openEditDialog(row as Record<string, unknown>),
        });
      }
    });

    this.api.get<{ total: number }>('finance/expenses/monthly-total').pipe(
        catchError(() => of({ total: 4820.50 }))
    ).subscribe(data => {
      this.totalKpi = { ...this.totalKpi, value: '$' + data.total.toFixed(2) };
    });
  }

  onFiltersChange(f: FilterParams): void { this.filters = f; }

  openAddDialog(): void {
    const ref = this.dialog.open(ExpenseFormDialogComponent, {
      width: '600px', maxWidth: '95vw', data: { formData: null },
    });
    ref.afterClosed().subscribe(data => {
      if (data) {
        this.api.post('entities/Expense', data).subscribe(() => {
          this.notifications.success('Expense added.'); this.reloadTrigger++;
        });
      }
    });
  }

  openEditDialog(expense: Record<string, unknown>): void {
    const ref = this.dialog.open(ExpenseFormDialogComponent, {
      width: '600px', maxWidth: '95vw', data: { formData: expense },
    });
    ref.afterClosed().subscribe(data => {
      if (data && expense['id']) {
        this.api.put('entities/Expense', String(expense['id']), data).subscribe(() => {
          this.notifications.success('Expense updated.'); this.reloadTrigger++;
        });
      }
    });
  }

  approve(row: { id: string }): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Approve Expense', message: 'Approve this expense?', confirmText: 'Approve', confirmColor: 'primary' },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.patch('entities/Expense', row.id, { approved: true }).subscribe(() => {
          this.notifications.success('Expense approved.'); this.reloadTrigger++;
        });
      }
    });
  }
}

import { Component as Comp, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Comp({
  selector: 'mdp-expense-form-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.formData ? 'Edit Expense' : 'Add Expense' }}</h2>
    <mat-dialog-content>
      <mdp-dynamic-form typeName="expense" [formData]="data.formData"
        [submitLabel]="data.formData ? 'Update' : 'Add'"
        (formSubmit)="ref.close($event)" (formCancel)="ref.close(null)">
      </mdp-dynamic-form>
    </mat-dialog-content>
  `,
})
export class ExpenseFormDialogComponent {
  constructor(
      public ref: MatDialogRef<ExpenseFormDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { formData: Record<string, unknown> | null },
  ) {}
}