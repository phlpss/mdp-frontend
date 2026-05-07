import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shared/components/shell/shell.component';
import { ForbiddenComponent } from './shared/components/forbidden/forbidden.component';

const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },

  // Protected shell routes
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'forbidden', component: ForbiddenComponent },

      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
      },
      {
        path: 'hr',
        loadChildren: () => import('./features/hr/hr.module').then(m => m.HrModule),
      },
      {
        path: 'finance',
        loadChildren: () => import('./features/finance/finance.module').then(m => m.FinanceModule),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
      },
    ],
  },

  // Wildcard fallback
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    paramsInheritanceStrategy: 'always',
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
