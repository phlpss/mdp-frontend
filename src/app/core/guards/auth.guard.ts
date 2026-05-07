import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private store: Store, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.store.select(selectIsAuthenticated).pipe(
      take(1),
      map(authenticated => authenticated ? true : this.router.createUrlTree(['/login']))
    );
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.canActivate();
  }
}
