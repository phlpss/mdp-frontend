import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, switchMap, filter, take, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private store: Store) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAccessToken();
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401(req, next);
        }
        return throwError(() => err);
      })
    );
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(tokens => {
          this.isRefreshing = false;
          this.refreshSubject.next(tokens.accessToken);
          return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } }));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.store.dispatch(AuthActions.logout());
          return throwError(() => err);
        })
      );
    }

    return this.refreshSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
    );
  }
}
