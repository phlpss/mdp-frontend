import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, action = 'OK'): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['snack-success'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  error(message: string, action = 'Dismiss'): void {
    this.snackBar.open(message, action, {
      duration: 6000,
      panelClass: ['snack-error'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  info(message: string, action = 'OK'): void {
    this.snackBar.open(message, action, {
      duration: 4000,
      panelClass: ['snack-info'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  warn(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
