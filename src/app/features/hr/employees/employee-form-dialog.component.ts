import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'mdp-employee-form-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.formData ? 'Edit Employee' : 'Add Employee' }}</h2>
    <mat-dialog-content>
      <mdp-dynamic-form
        typeName="employee"
        [formData]="data.formData"
        submitLabel="{{ data.formData ? 'Update' : 'Create' }}"
        (formSubmit)="onSubmit($event)"
        (formCancel)="ref.close(null)">
      </mdp-dynamic-form>
    </mat-dialog-content>
  `,
})
export class EmployeeFormDialogComponent {
  constructor(
    public ref: MatDialogRef<EmployeeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { formData: Record<string, unknown> | null },
  ) {}

  onSubmit(value: Record<string, unknown>): void {
    this.ref.close(value);
  }
}
