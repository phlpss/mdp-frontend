import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { selectFormAttributesForType } from '@store/metadata/metadata.selectors';

@Component({
  selector: 'mdp-employee-form-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.formData ? 'Edit Employee' : 'Add Employee' }}</h2>
    <mat-dialog-content>
      <mdp-dynamic-form
        typeName="Employee"
        [formData]="data.formData"
        [hiddenFields]="hiddenFields"
        submitLabel="{{ data.formData ? 'Update' : 'Create' }}"
        [extraFields]="extraFields"
        (formValuesChange)="onValuesChange($event)"
        (formSubmit)="onSubmit($event)"
        (formCancel)="ref.close(null)">

        <!-- Initial Password slot — projected above the action buttons -->
        <ng-container slot="before-actions" *ngIf="!data.formData">
          <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
            <mat-label>Initial Password</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" required/>
            <button mat-icon-button matSuffix (click)="showPassword = !showPassword" type="button">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
        </ng-container>
      </mdp-dynamic-form>
    </mat-dialog-content>
  `,
})
export class EmployeeFormDialogComponent implements OnInit, OnDestroy {
  password = '';
  showPassword = false;

  /** Fields the dynamic form should hide based on current paymentType selection */
  hiddenFields: string[] = ['monthlySalary', 'hourlyRate'];

  /** Pass-through for any extra projected content the dynamic-form doesn't know about */
  extraFields: Record<string, unknown> = {};

  private sub = new Subscription();

  constructor(
      public ref: MatDialogRef<EmployeeFormDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { formData: Record<string, unknown> | null },
      private store: Store,
  ) {}

  ngOnInit(): void {
    // If editing, derive initial hidden-fields state from existing formData
    if (this.data.formData) {
      this.updateHiddenFields(this.data.formData['paymentType'] as string | null);
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onValuesChange(values: Record<string, unknown>): void {
    this.updateHiddenFields(values['paymentType'] as string | null);
  }

  private updateHiddenFields(paymentType: string | null): void {
    const hidden: string[] = [];
    if (paymentType !== 'MONTHLY_SALARY') hidden.push('monthlySalary');
    if (paymentType !== 'HOURLY_RATE')    hidden.push('hourlyRate');
    this.hiddenFields = hidden;
  }

  onSubmit(value: Record<string, unknown>): void {
    if (!this.data.formData && !this.password.trim()) return;
    // Strip the salary field not relevant to the chosen payment type
    const payload = { ...value };
    if (this.hiddenFields.includes('monthlySalary')) delete payload['monthlySalary'];
    if (this.hiddenFields.includes('hourlyRate'))    delete payload['hourlyRate'];
    this.ref.close(this.data.formData ? payload : { ...payload, password: this.password });
  }
}