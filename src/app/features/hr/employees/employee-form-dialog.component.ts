import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'mdp-employee-form-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.formData ? 'Edit Employee' : 'Add Employee' }}</h2>
    <mat-dialog-content>
      <mdp-dynamic-form
        typeName="Employee"
        [formData]="data.formData"
        submitLabel="{{ data.formData ? 'Update' : 'Create' }}"
        (formSubmit)="onSubmit($event)"
        (formCancel)="ref.close(null)">
      </mdp-dynamic-form>
      <mat-form-field *ngIf="!data.formData" appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>Initial Password</mat-label>
        <input matInput [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" required/>
        <button mat-icon-button matSuffix (click)="showPassword = !showPassword" type="button">
          <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
    </mat-dialog-content>
  `,
})
export class EmployeeFormDialogComponent {
  password = '';
  showPassword = false;

  constructor(
      public ref: MatDialogRef<EmployeeFormDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { formData: Record<string, unknown> | null },
  ) {
  }

  onSubmit(value: Record<string, unknown>): void {
    if (!this.data.formData && !this.password.trim()) return; // password required on create
    this.ref.close(this.data.formData ? value : {...value, password: this.password});
  }
}