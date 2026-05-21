import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { first, map, take } from 'rxjs/operators';
import { MetaAttribute } from '@core/models/meta.model';
import { selectFormAttributesForType } from '@store/metadata/metadata.selectors';
import { selectCanViewSensitive } from '@store/auth/auth.selectors';
import {ApiService} from "@core/services/api.service";

interface FormGroup_ {
  groupName: string;
  attributes: MetaAttribute[];
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
  @Output() formSubmit = new EventEmitter<Record<string, unknown>>();
  @Output() formCancel = new EventEmitter<void>();

  form!: FormGroup;
  attributes$!: Observable<MetaAttribute[]>;
  canViewSensitive$!: Observable<boolean>;
  fieldGroups$!: Observable<FormGroup_[]>;

  constructor(
   private store: Store,
   private fb: FormBuilder,
   private api: ApiService,
   private cdr: ChangeDetectorRef
 ) {}

  referenceOptions: Record<string, { id: string; label: string }[]> = {};

  ngOnInit(): void {
    this.store.select(state => state).pipe(take(1)).subscribe(s => {
      console.log('[DEBUG] full store state:', s);
    });
    this.store.select(selectFormAttributesForType(this.typeName)).pipe(take(1)).subscribe(attrs => {
      console.log('[DEBUG] typeName:', this.typeName);
      console.log('[DEBUG] attrs from store:', attrs);
    });
    this.attributes$       = this.store.select(selectFormAttributesForType(this.typeName));
    this.attributes$.pipe(first(attrs => attrs.length > 0)).subscribe(attrs => {
      attrs.filter(a => a.fieldType === 'reference' && a.referenceType).forEach(attr => {
        this.api.getPage<unknown>(
            `entities/${attr.referenceType}`,
            {page: 0, size: 100}, {}
        ).subscribe((page: any) => {
          this.referenceOptions[attr.name] = page.content.map((item: any) => ({
            id: item.id,
            label: item.payload?.name ?? item.payload?.fullName ?? item.id
          }));
        });
      });
    });
    this.canViewSensitive$ = this.store.select(selectCanViewSensitive);
    this.fieldGroups$      = this.attributes$.pipe(map(attrs => this.groupAttributes(attrs)));
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

  private buildForm(): void {
    this.attributes$.pipe(first(attrs => attrs.length > 0)).subscribe(attrs => {
      const controls: Record<string, AbstractControl> = {};
      attrs.forEach(attr => {
        const validators: ValidatorFn[] = [];
        if (attr.required && !attr.readOnly) validators.push(Validators.required);
        if (attr.minLength) validators.push(Validators.minLength(attr.minLength));
        if (attr.maxLength) validators.push(Validators.maxLength(attr.maxLength));
        if (attr.min !== undefined && ['number','currency'].includes(attr.fieldType)) {
          validators.push(Validators.min(attr.min));
        }
        if (attr.max !== undefined && ['number','currency'].includes(attr.fieldType)) {
          validators.push(Validators.max(attr.max));
        }
        if (attr.fieldType === 'email') validators.push(Validators.email);
        if (attr.pattern) validators.push(Validators.pattern(attr.pattern));
        controls[attr.name] = this.fb.control(
          { value: attr.defaultValue ?? null, disabled: attr.readOnly || this.readOnly },
          validators
        );
      });
      this.form = this.fb.group(controls);
      this.patchFormValues();
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
    return Array.from(map.entries()).map(([groupName, attributes]) => ({ groupName, attributes }));
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
    if (ctrl.errors['required']) return `${attr.label} is required`;
    if (ctrl.errors['email'])    return 'Invalid email address';
    if (ctrl.errors['min'])      return `Minimum value is ${attr.min}`;
    if (ctrl.errors['max'])      return `Maximum value is ${attr.max}`;
    if (ctrl.errors['minlength']) return `Minimum ${attr.minLength} characters`;
    if (ctrl.errors['maxlength']) return `Maximum ${attr.maxLength} characters`;
    if (ctrl.errors['pattern'])  return `Invalid format`;
    return 'Invalid value';
  }
}
