import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { DynamicFormComponent } from '@shared/components/dynamic-form/dynamic-form.component';
import { MetadataActions } from '@store/metadata/metadata.actions';
import { selectFormAttributesForType, selectMetaLoaded } from '@store/metadata/metadata.selectors';

@Component({
  selector: 'mdp-employee-create-page',
  templateUrl: './employee-create-page.component.html',
  styleUrls: ['./employee-create-page.component.scss'],
})
export class EmployeeCreatePageComponent implements OnInit, OnDestroy {
  @ViewChild('dynForm') dynForm!: DynamicFormComponent;

  metaReady$!: Observable<boolean>;
  hiddenFields: string[] = ['monthlySalary', 'hourlyRate'];
  password = '';
  showPassword = false;
  saving = false;

  private metaSub?: Subscription;

  constructor(
    private store: Store,
    private router: Router,
    private api: ApiService,
    private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.metaReady$ = this.store.select(selectFormAttributesForType('Employee')).pipe(
      map(attrs => attrs.length > 0),
    );
    this.metaSub = this.store.select(selectMetaLoaded).subscribe(loaded => {
      if (!loaded) this.store.dispatch(MetadataActions.loadTypes());
    });
  }

  ngOnDestroy(): void {
    this.metaSub?.unsubscribe();
  }

  onValuesChange(values: Record<string, unknown>): void {
    const pt = values['paymentType'] as string | null;
    const hidden: string[] = [];
    if (pt !== 'MONTHLY_SALARY') hidden.push('monthlySalary');
    if (pt !== 'HOURLY_RATE') hidden.push('hourlyRate');
    this.hiddenFields = hidden;
  }

  onSubmit(value: Record<string, unknown>): void {
    if (!this.password.trim()) return;
    const payload = { ...value };
    if (this.hiddenFields.includes('monthlySalary')) delete payload['monthlySalary'];
    if (this.hiddenFields.includes('hourlyRate')) delete payload['hourlyRate'];
    const body = { ...payload, password: this.password };
    this.saving = true;
    this.api.post('hr/employees', body).subscribe({
      next: () => {
        this.notifications.success('Employee created.');
        this.router.navigate(['/hr/employees']);
      },
      error: () => { this.saving = false; },
    });
  }

  triggerSubmit(): void {
    this.dynForm?.submit();
  }

  cancel(): void {
    if (this.dynForm?.form?.dirty) {
      if (!confirm('You have unsaved changes. Leave anyway?')) return;
    }
    this.router.navigate(['/hr/employees']);
  }
}
