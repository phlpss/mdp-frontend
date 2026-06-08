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

@Component({
  selector: 'mdp-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
})
export class InventoryListComponent implements OnInit {
  filters: FilterParams = {};
  canEdit = false;
  reloadTrigger = 0;
  lowStockKpi: KpiData = { label: 'Low Stock Items', value: 0, icon: 'warning', color: '#e53935' };
  tableActions: TableAction[] = [];

  constructor(
      private store: Store,
      private dialog: MatDialog,
      private api: ApiService,
      private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser).subscribe(user => {
      this.canEdit = hasRole(user, 'STORE_MANAGER', 'SHIFT_SUPERVISOR');
      this.tableActions = [
        { icon: 'edit', label: 'Edit', handler: (row) => this.openEditDialog(row as Record<string, unknown>) },
        { icon: 'tune', label: 'Adjust Stock', handler: (row) => this.openAdjustDialog(row as Record<string, unknown>) },
      ];
    });

    this.api.get<{ count: number }>('inventory/low-stock-count').pipe(
        catchError(() => of({ count: 2 }))
    ).subscribe(data => {
      this.lowStockKpi = { ...this.lowStockKpi, value: data.count };
    });
  }

  onFiltersChange(f: FilterParams): void { this.filters = f; }

  openAddDialog(): void {
    const ref = this.dialog.open(InventoryFormDialogComponent, {
      width: '600px', maxWidth: '95vw', data: { formData: null },
    });
    ref.afterClosed().subscribe(data => {
      if (data) {
        this.api.post('entities/InventoryItem', data).subscribe(() => {
          this.notifications.success('Item added.'); this.reloadTrigger++;
        });
      }
    });
  }

  openEditDialog(item: Record<string, unknown>): void {
    const ref = this.dialog.open(InventoryFormDialogComponent, {
      width: '600px', maxWidth: '95vw', data: { formData: item },
    });
    ref.afterClosed().subscribe(data => {
      if (data && item['id']) {
        this.api.put('entities/InventoryItem', String(item['id']), data).subscribe(() => {
          this.notifications.success('Item updated.'); this.reloadTrigger++;
        });
      }
    });
  }

  openAdjustDialog(item: Record<string, unknown>): void {
    const ref = this.dialog.open(StockAdjustDialogComponent, {
      width: '400px', data: { item },
    });
    ref.afterClosed().subscribe(delta => {
      if (delta !== undefined && delta !== null) {
        this.api.patch('entities/InventoryItem', String(item['id']), { quantityDelta: delta }).subscribe(() => {
          this.notifications.success('Stock adjusted.'); this.reloadTrigger++;
        });
      }
    });
  }
}

import { Component as Comp, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Comp({
  selector: 'mdp-inventory-form-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.formData ? 'Edit Item' : 'Add Item' }}</h2>
    <mat-dialog-content>
      <mdp-dynamic-form typeName="inventory_item" [formData]="data.formData"
        [submitLabel]="data.formData ? 'Update' : 'Add'"
        (formSubmit)="ref.close($event)" (formCancel)="ref.close(null)">
      </mdp-dynamic-form>
    </mat-dialog-content>
  `,
})
export class InventoryFormDialogComponent {
  constructor(
      public ref: MatDialogRef<InventoryFormDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { formData: Record<string, unknown> | null },
  ) {}
}

@Comp({
  selector: 'mdp-stock-adjust-dialog',
  template: `
    <h2 mat-dialog-title>Adjust Stock: {{ data.item['name'] }}</h2>
    <mat-dialog-content>
      <p>Current quantity: <strong>{{ data.item['quantity'] }} {{ data.item['unit'] }}</strong></p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="mdp-full-width">
          <mat-label>Quantity Adjustment (+/-)</mat-label>
          <input matInput type="number" formControlName="delta" placeholder="e.g. -5 or +10">
          <mat-hint>Negative to decrease, positive to increase</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(null)">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Apply</button>
    </mat-dialog-actions>
  `,
})
export class StockAdjustDialogComponent {
  form: FormGroup;
  constructor(
      public ref: MatDialogRef<StockAdjustDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { item: Record<string, unknown> },
      fb: FormBuilder,
  ) {
    this.form = fb.group({ delta: [null, Validators.required] });
  }
  submit(): void {
    if (this.form.valid) this.ref.close(this.form.value.delta);
  }
}