import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { SharedModule } from '@shared/shared.module';
import { RoleGuard } from '@core/guards/role.guard';

import { TransactionListComponent } from './transactions/transaction-list.component';
import { ExpenseListComponent, ExpenseFormDialogComponent } from './expenses/expense-list.component';
import { InventoryListComponent, InventoryFormDialogComponent, StockAdjustDialogComponent } from './inventory/inventory-list.component';
import { PayrollComponent } from './payroll/payroll.component';
import { ForecastComponent } from './forecast/forecast.component';
import { ClosingReportComponent } from './closing-report/closing-report.component';

const routes: Routes = [
    { path: '',                  redirectTo: 'transactions', pathMatch: 'full' },
    { path: 'transactions',      component: TransactionListComponent },
    { path: 'expenses',          component: ExpenseListComponent },
    { path: 'inventory',         component: InventoryListComponent },
    { path: 'payroll',           component: PayrollComponent,
        canActivate: [RoleGuard], data: { roles: ['ACCOUNTANT'] } },
    { path: 'forecast',          component: ForecastComponent,
        canActivate: [RoleGuard], data: { roles: ['ACCOUNTANT', 'BUSINESS_OWNER', 'STORE_MANAGER'] } },
    { path: 'closing-report',    component: ClosingReportComponent,
        canActivate: [RoleGuard], data: { roles: ['STORE_MANAGER', 'SHIFT_SUPERVISOR'] } },
];

@NgModule({
    declarations: [
        TransactionListComponent,
        ExpenseListComponent,
        ExpenseFormDialogComponent,
        InventoryListComponent,
        InventoryFormDialogComponent,
        StockAdjustDialogComponent,
        PayrollComponent,
        ForecastComponent,
        ClosingReportComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        SharedModule,
        BaseChartDirective,
    ],
})
export class FinanceModule {}