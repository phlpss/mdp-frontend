import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { hasRole, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private store: Store, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const requiredRoles: UserRole[] = route.data['roles'] ?? [];

    return this.store.select(selectCurrentUser).pipe(
      take(1),
      map(user => {
        if (!requiredRoles.length) return true;
        if (hasRole(user, ...requiredRoles)) return true;
        return this.router.createUrlTree(['/forbidden']);
      })
    );
  }
}
