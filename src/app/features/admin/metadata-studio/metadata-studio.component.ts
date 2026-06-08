import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MetadataActions } from '@store/metadata/metadata.actions';
import { selectAllTypes, selectMetaLoading, selectTypeByName } from '@store/metadata/metadata.selectors';
import { MetaAttribute, MetaType, FieldType } from '@core/models/meta.model';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ApiService } from '@core/services/api.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'mdp-metadata-studio',
  templateUrl: './metadata-studio.component.html',
  styleUrls: ['./metadata-studio.component.scss'],
})
export class MetadataStudioComponent implements OnInit {
  types$!: Observable<MetaType[]>;
  loading$!: Observable<boolean>;
  selectedTypeName: string | null = null;
  selectedType$!: Observable<MetaType | null>;

  showAddAttrForm = false;
  addAttrForm!: FormGroup;

  showNewTypeForm = false;
  newTypeForm!: FormGroup;

  editingAttr: MetaAttribute | null = null;
  editAttrForm!: FormGroup;

  readonly fieldTypes: FieldType[] = [
    'string','number','boolean','date','datetime',
    'enum','email','phone','currency','text','file','reference'
  ];

  readonly displayedColumns = ['order','label','fieldType','required','sensitive','sortable','filterable','showInList','showInForm','actions'];

  constructor(
      private store: Store,
      private fb: FormBuilder,
      private dialog: MatDialog,
      private notifications: NotificationService,
      private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.types$   = this.store.select(selectAllTypes);
    this.loading$ = this.store.select(selectMetaLoading);
    this.store.dispatch(MetadataActions.loadTypes());
    this.initAttrForm();
    this.initNewTypeForm();
    this.initEditAttrForm();
  }

  private initAttrForm(): void {
    this.addAttrForm = this.fb.group({
      name:        ['', [Validators.required, Validators.pattern(/^[a-z][a-zA-Z0-9]*$/)]],
      label:       ['', Validators.required],
      fieldType:   ['string', Validators.required],
      required:    [false],
      sensitive:   [false],
      sortable:    [true],
      filterable:  [false],
      showInList:  [false],
      showInForm:  [true],
      readOnly:    [false],
      min:         [null],
      max:         [null],
      placeholder: [''],
      hint:        [''],
      group:       [''],
      order:       [99],
    });
  }

  private initNewTypeForm(): void {
    this.newTypeForm = this.fb.group({
      name:        ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*$/)]],
      label:       ['', Validators.required],
      pluralLabel: [''],
      description: [''],
      icon:        ['table_chart'],
    });
  }

  private initEditAttrForm(attr?: MetaAttribute): void {
    this.editAttrForm = this.fb.group({
      label:       [attr?.label ?? '', Validators.required],
      fieldType:   [attr?.fieldType ?? 'string', Validators.required],
      required:    [attr?.required ?? false],
      sensitive:   [attr?.sensitive ?? false],
      sortable:    [attr?.sortable ?? true],
      filterable:  [attr?.filterable ?? false],
      showInList:  [attr?.showInList ?? false],
      showInForm:  [attr?.showInForm ?? true],
      readOnly:    [attr?.readOnly ?? false],
      min:         [attr?.min ?? null],
      max:         [attr?.max ?? null],
      placeholder: [attr?.placeholder ?? ''],
      hint:        [attr?.hint ?? ''],
      group:       [attr?.group ?? ''],
      order:       [attr?.order ?? 99],
    });
  }

  selectType(typeName: string): void {
    this.selectedTypeName = typeName;
    this.selectedType$ = this.store.select(selectTypeByName(typeName));
    this.showAddAttrForm = false;
    this.editingAttr = null;
    this.initAttrForm();
  }

  toggleAddAttrForm(): void {
    this.showAddAttrForm = !this.showAddAttrForm;
    this.editingAttr = null;
    if (!this.showAddAttrForm) this.initAttrForm();
  }

  toggleNewTypeForm(): void {
    this.showNewTypeForm = !this.showNewTypeForm;
    if (!this.showNewTypeForm) this.initNewTypeForm();
  }

  submitCreateType(): void {
    if (this.newTypeForm.invalid) { this.newTypeForm.markAllAsTouched(); return; }
    const v = this.newTypeForm.value;
    this.store.dispatch(MetadataActions.createType({
      metaType: {
        name: v.name,
        label: v.label,
        pluralLabel: v.pluralLabel || v.label + 's',
        description: v.description,
        icon: v.icon || 'table_chart',
        attributes: [],
      }
    }));
    this.showNewTypeForm = false;
    this.initNewTypeForm();
  }

  submitAddAttr(): void {
    if (!this.selectedTypeName || this.addAttrForm.invalid) {
      this.addAttrForm.markAllAsTouched(); return;
    }
    this.store.dispatch(MetadataActions.addAttribute({
      typeName: this.selectedTypeName,
      attribute: this.addAttrForm.value,
    }));
    this.showAddAttrForm = false;
    this.initAttrForm();
  }

  startEditAttr(attr: MetaAttribute): void {
    this.editingAttr = attr;
    this.showAddAttrForm = false;
    this.initEditAttrForm(attr);
  }

  cancelEditAttr(): void {
    this.editingAttr = null;
    this.initEditAttrForm();
  }

  submitEditAttr(): void {
    if (!this.selectedTypeName || !this.editingAttr || this.editAttrForm.invalid) {
      this.editAttrForm.markAllAsTouched(); return;
    }
    this.store.dispatch(MetadataActions.updateAttribute({
      typeName: this.selectedTypeName,
      attrName: this.editingAttr.name,
      attribute: this.editAttrForm.value,
    }));
    this.editingAttr = null;
    this.initEditAttrForm();
  }

  reloadSchema(): void {
    this.api.post<void>('admin/metadata/reload', {}).pipe(
        catchError(() => of(null))
    ).subscribe(() => {
      this.store.dispatch(MetadataActions.loadTypes());
      this.notifications.success('Schema reloaded.');
    });
  }

  deleteAttribute(typeName: string, attr: MetaAttribute): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Attribute',
        message: `Remove attribute "${attr.label}" from type "${typeName}"? This may break existing data.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.dispatch(MetadataActions.deleteAttribute({ typeName, attrName: attr.name }));
      }
    });
  }

  getBoolIcon(val: boolean): string {
    return val ? 'check_circle' : 'cancel';
  }

  getBoolColor(val: boolean): string {
    return val ? 'primary' : '';
  }

  liveVal(attr: MetaAttribute, field: 'required' | 'sensitive' | 'sortable' | 'filterable' | 'showInList' | 'showInForm'): boolean {
    if (this.editingAttr?.name === attr.name) {
      return this.editAttrForm.get(field)?.value ?? attr[field];
    }
    return attr[field];
  }

  sortedAttributes(attrs: MetaAttribute[]): MetaAttribute[] {
    return [...attrs].sort((a, b) => a.order - b.order);
  }
}
