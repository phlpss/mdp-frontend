import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { hasRole } from '../../core/models/user.model';

@Component({
  selector: 'mdp-dashboard-routing',
  template: '<div class="loading-overlay"><mat-spinner></mat-spinner></div>',
})
export class DashboardRoutingComponent implements OnInit {
  constructor(private store: Store, private router: Router) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser).pipe(take(1)).subscribe(user => {
      if (!user) { this.router.navigate(['/login']); return; }
      if (hasRole(user, 'OWNER', 'IT_ADMIN')) {
        this.router.navigate(['/dashboard/owner']);
      } else if (hasRole(user, 'MANAGER', 'SUPERVISOR', 'ACCOUNTANT')) {
        this.router.navigate(['/dashboard/manager']);
      } else {
        this.router.navigate(['/dashboard/employee']);
      }
    });
  }
}
