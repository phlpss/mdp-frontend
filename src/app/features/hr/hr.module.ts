import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SharedModule} from '@shared/shared.module';
import {RoleGuard} from '@core/guards/role.guard';

import {EmployeeListComponent} from './employees/employee-list.component';
import {EmployeeDetailComponent} from './employees/employee-detail.component';
import {EmployeeFormDialogComponent} from './employees/employee-form-dialog.component';
import {ShiftCalendarComponent, ShiftFormDialogComponent} from './shifts/shift-calendar.component';
import {LeaveListComponent, LeaveRequestDialogComponent} from './leaves/leave-list.component';

const routes: Routes = [
    {path: '', redirectTo: 'employees', pathMatch: 'full'},
    {path: 'employees', component: EmployeeListComponent},
    {path: 'employees/:id', component: EmployeeDetailComponent},
    {path: 'shifts/my', component: ShiftCalendarComponent},
    {
        path: 'shifts', component: ShiftCalendarComponent,
        canActivate: [RoleGuard], data: {roles: ['MANAGER', 'SUPERVISOR', 'HR', 'OWNER', 'IT_ADMIN']}
    },
    {path: 'leaves/my', component: LeaveListComponent},
    {
        path: 'leaves', component: LeaveListComponent,
        canActivate: [RoleGuard], data: {roles: ['MANAGER', 'SUPERVISOR', 'HR', 'OWNER']}
    },
];

@NgModule({
    declarations: [
        EmployeeListComponent,
        EmployeeDetailComponent,
        EmployeeFormDialogComponent,
        ShiftCalendarComponent,
        ShiftFormDialogComponent,
        LeaveListComponent,
        LeaveRequestDialogComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        SharedModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatChipsModule,
        MatProgressBarModule,
        MatListModule,
        MatDividerModule,
        MatTooltipModule,
    ],
})
export class HrModule {
}