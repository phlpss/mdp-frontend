import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { MetaAttribute } from '@core/models/meta.model';
import { selectFormAttributesForType } from '@store/metadata/metadata.selectors';
import { selectCanViewSensitive } from '@store/auth/auth.selectors';
import { ApiService } from '@core/services/api.service';

interface FormGroup_ {
  groupName: string;
  attributes: MetaAttribute[];
  columns?: number;
}

@Component({
  selector: 'mdp-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() typeName!: string;
  @Input() formData: Record<string, unknown> | null = null;
  @Input() readOnly = false;
  @Input() submitLabel = 'Save';
  /** Field names that should be hidden (but still in the form group) */
  @Input() hiddenFields: string[] = [];

  @Output() formSubmit = new EventEmitter<Record<string, unknown>>();
  @Output() formCancel = new EventEmitter<void>();
  /** Emits on every value change so the parent can react (e.g. conditional fields) */
  @Output() formValuesChange = new EventEmitter<Record<string, unknown>>();

  form!: FormGroup;
  attributes$!: Observable<MetaAttribute[]>;
  canViewSensitive$!: Observable<boolean>;
  fieldGroups$!: Observable<FormGroup_[]>;

  referenceOptions: Record<string, { id: string; label: string }[]> = {};
  canView = false;

  private valueSub?: Subscription;
  @Input() extraFields!: { [p: string]: unknown };

  constructor(
      private store: Store,
      private fb: FormBuilder,
      private api: ApiService,
      private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.attributes$ = this.store.select(selectFormAttributesForType(this.typeName));
    this.attributes$.pipe(first(attrs => attrs.length > 0)).subscribe(attrs => {
      attrs.filter(a => a.fieldType === 'reference' && a.referenceType).forEach(attr => {
        this.api.getPage<unknown>(
            `entities/${attr.referenceType}`,
            { page: 0, size: 100 }, {}
        ).subscribe((page: any) => {
          this.referenceOptions[attr.name] = page.content.map((item: any) => ({
            id: item.id,
            label: item.payload?.storeName ?? item.payload?.name ?? item.payload?.fullName ?? item.id,
          }));
        });
      });
    });

    this.canViewSensitive$ = this.store.select(selectCanViewSensitive);
    this.canViewSensitive$.subscribe(v => { this.canView = !!v; });
    this.fieldGroups$ = this.attributes$.pipe(map(attrs => this.groupAttributes(attrs)));
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData'] && this.form) {
      this.patchFormValues();
    }
    if (changes['typeName'] && !changes['typeName'].firstChange) {
      this.buildForm();
    }
  }

  isHidden(attrName: string): boolean {
    return this.hiddenFields.includes(attrName);
  }

  private buildForm(): void {
    this.attributes$.pipe(first(attrs => attrs.length > 0)).subscribe(attrs => {
      const controls: Record<string, AbstractControl> = {};
      attrs.forEach(attr => {
        const validators: ValidatorFn[] = [];
        if (attr.required && !attr.readOnly) validators.push(Validators.required);
        if (attr.minLength) validators.push(Validators.minLength(attr.minLength));
        if (attr.maxLength) validators.push(Validators.maxLength(attr.maxLength));
        if (attr.min !== undefined && ['number', 'currency'].includes(attr.fieldType)) {
          validators.push(Validators.min(attr.min));
        }
        if (attr.max !== undefined && ['number', 'currency'].includes(attr.fieldType)) {
          validators.push(Validators.max(attr.max));
        }
        if (attr.fieldType === 'email') validators.push(Validators.email);
        if (attr.pattern) validators.push(Validators.pattern(attr.pattern));
        controls[attr.name] = this.fb.control(
            { value: attr.defaultValue ?? null, disabled: attr.readOnly || this.readOnly },
            validators,
        );
      });
      this.form = this.fb.group(controls);
      this.patchFormValues();

      // Subscribe to value changes to emit to parent
      this.valueSub?.unsubscribe();
      this.valueSub = this.form.valueChanges.subscribe(values => {
        this.formValuesChange.emit(values);
      });

      this.cdr.detectChanges();
    });
  }

  private patchFormValues(): void {
    if (this.formData && this.form) {
      this.form.patchValue(this.formData, { emitEvent: false });
    }
  }

  private groupAttributes(attrs: MetaAttribute[]): FormGroup_[] {
    const map = new Map<string, MetaAttribute[]>();
    attrs.forEach(attr => {
      const key = attr.group ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(attr);
    });
    return Array.from(map.entries()).map(([groupName, attributes]) => {
      const columns = attributes.reduce((max, a) => Math.max(max, a.groupColumns ?? 0), 0) || undefined;
      return { groupName, attributes, columns };
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formSubmit.emit(this.form.getRawValue() as Record<string, unknown>);
  }

  cancel(): void {
    this.formCancel.emit();
  }

  isNumericType(attr: MetaAttribute): boolean {
    return ['number', 'currency'].includes(attr.fieldType);
  }

  isTextType(attr: MetaAttribute): boolean {
    return ['string', 'email', 'phone'].includes(attr.fieldType);
  }

  getFieldError(attr: MetaAttribute): string {
    const ctrl = this.form?.get(attr.name);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required'])   return `${attr.label} is required`;
    if (ctrl.errors['email'])      return 'Invalid email address';
    if (ctrl.errors['min'])        return `Minimum value is ${attr.min}`;
    if (ctrl.errors['max'])        return `Maximum value is ${attr.max}`;
    if (ctrl.errors['minlength'])  return `Minimum ${attr.minLength} characters`;
    if (ctrl.errors['maxlength'])  return `Maximum ${attr.maxLength} characters`;
    if (ctrl.errors['pattern'])    return 'Invalid format';
    return 'Invalid value';
  }
}