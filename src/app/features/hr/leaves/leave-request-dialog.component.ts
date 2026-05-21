import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'mdp-leave-request-dialog',
    template: `
    <h2 mat-dialog-title>Request Leave</h2>
    <mat-dialog-content>
      <mdp-dynamic-form
        typeName="LeaveRequest"
        [formData]="null"
        submitLabel="Submit Request"
        (formSubmit)="onSubmit($event)"
        (formCancel)="ref.close(null)">
      </mdp-dynamic-form>
    </mat-dialog-content>
  `,
})
export class LeaveRequestDialogComponent {
    constructor(
        public ref: MatDialogRef<LeaveRequestDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: unknown,
    ) {}

    onSubmit(v: Record<string, unknown>): void {
        this.ref.close(v);
    }
}