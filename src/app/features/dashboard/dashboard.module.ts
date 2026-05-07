import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { BaseChartDirective } from 'ng2-charts';
import { SharedModule } from '../../shared/shared.module';
import { RoleGuard } from '../../core/guards/role.guard';
import { DashboardRoutingComponent } from './dashboard-routing.component';
import { EmployeeDashboardComponent } from './employee-dashboard/employee-dashboard.component';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { OwnerDashboardComponent } from './owner-dashboard/owner-dashboard.component';

const routes: Routes = [
  { path: '',         component: DashboardRoutingComponent },
  { path: 'employee', component: EmployeeDashboardComponent },
  { path: 'manager',  component: ManagerDashboardComponent,
    canActivate: [RoleGuard], data: { roles: ['MANAGER','SUPERVISOR','ACCOUNTANT','HR'] } },
  { path: 'owner',    component: OwnerDashboardComponent,
    canActivate: [RoleGuard], data: { roles: ['OWNER','IT_ADMIN'] } },
];

@NgModule({
  declarations: [
    DashboardRoutingComponent,
    EmployeeDashboardComponent,
    ManagerDashboardComponent,
    OwnerDashboardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    BaseChartDirective,
  ],
})
export class DashboardModule {}
