import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../models/api.model';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notifications: NotificationService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = error.error as ApiError;
        let message = 'An unexpected error occurred';

        if (error.status === 0) {
          message = 'Network error. Please check your connection.';
        } else if (error.status === 403) {
          message = 'You do not have permission to perform this action.';
        } else if (error.status === 404) {
          message = apiError?.message ?? 'Resource not found.';
        } else if (error.status === 409) {
          message = apiError?.message ?? 'Conflict: resource already exists.';
        } else if (error.status === 422 || error.status === 400) {
          if (apiError?.fieldErrors?.length) {
            message = apiError.fieldErrors.map(fe => `${fe.field}: ${fe.message}`).join('; ');
          } else {
            message = apiError?.message ?? 'Validation error.';
          }
        } else if (error.status >= 500) {
          message = 'Server error. Please try again later.';
        } else if (apiError?.message) {
          message = apiError.message;
        }

        // Don't show notification for auth endpoints (handled by auth flow)
        if (!req.url.includes('/auth/login')) {
          this.notifications.error(message);
        }

        return throwError(() => ({ ...error, displayMessage: message }));
      })
    );
  }
}
