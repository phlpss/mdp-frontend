import { Component } from '@angular/core';

@Component({
  selector: 'mdp-forbidden',
  template: `
    <div class="forbidden-page">
      <mat-icon>lock</mat-icon>
      <h2>Access Denied</h2>
      <p>You don't have permission to view this page.</p>
      <a mat-raised-button color="primary" routerLink="/dashboard">Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .forbidden-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 16px;
      color: #888;
      text-align: center;

      mat-icon {
        font-size: 72px; width: 72px; height: 72px;
        color: #e53935;
      }
      h2 { margin: 0; color: #333; }
      p { margin: 0; font-size: 16px; }
    }
  `],
})
export class ForbiddenComponent {}
