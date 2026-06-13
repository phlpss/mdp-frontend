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
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SharedModule} from '@shared/shared.module';
import {RoleGuard} from '@core/guards/role.guard';

import {EmployeeListComponent} from './employees/employee-list.component';
import {EmployeeDetailComponent} from './employees/employee-detail.component';
import {EmployeeCreatePageComponent} from './employees/employee-create-page.component';
import {EmployeeFormDialogComponent} from './employees/employee-form-dialog.component';
import {ShiftCalendarComponent, ShiftFormDialogComponent} from './shifts/shift-calendar.component';
import {LeaveListComponent} from './leaves/leave-list.component';
import {LeaveRequestDialogComponent} from './leaves/leave-request-dialog.component';
import {ClockWidgetComponent} from "@features/hr/shifts/clock-widget.component";
import {AuthGuard} from "@core/guards/auth.guard";

 const routes: Routes = [
    {path: '', redirectTo: 'employees', pathMatch: 'full'},
    {path: 'employees', component: EmployeeListComponent},
    {
        path: 'employees/new', component: EmployeeCreatePageComponent,
        canActivate: [RoleGuard], data: {roles: ['HR_MANAGER', 'IT_SPECIALIST']},
    },
    {path: 'employees/:id', component: EmployeeDetailComponent},
    {path: 'shifts/my', component: ShiftCalendarComponent},
    {path: 'shifts/my/upcoming', component: ShiftCalendarComponent},
    {
        path: 'shifts', component: ShiftCalendarComponent,
        canActivate: [RoleGuard], data: {roles: ['STORE_MANAGER', 'SHIFT_SUPERVISOR', 'HR_MANAGER', 'BUSINESS_OWNER', 'IT_SPECIALIST']}
    },
    {path: 'leaves/my', component: LeaveListComponent},
    {
        path: 'leaves', component: LeaveListComponent,
        canActivate: [RoleGuard], data: {roles: ['STORE_MANAGER', 'SHIFT_SUPERVISOR', 'HR_MANAGER', 'BUSINESS_OWNER']}
    },
    {
        path: 'shifts/clock', component: ClockWidgetComponent, canActivate: [AuthGuard]
    },
];

@NgModule({
    declarations: [
        EmployeeListComponent,
        EmployeeDetailComponent,
        EmployeeCreatePageComponent,
        EmployeeFormDialogComponent,
        ShiftCalendarComponent,
        ShiftFormDialogComponent,
        LeaveListComponent,
        LeaveRequestDialogComponent,
        ClockWidgetComponent,
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
        MatProgressSpinnerModule,
        MatListModule,
        MatDividerModule,
        MatTooltipModule,
    ],
})
export class HrModule {
}