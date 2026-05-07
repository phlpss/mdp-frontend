import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MetadataActions } from '../../../store/metadata/metadata.actions';
import { selectAllTypes, selectMetaLoading, selectTypeByName } from '../../../store/metadata/metadata.selectors';
import { MetaAttribute, MetaType, FieldType } from '../../../core/models/meta.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

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
  ) {}

  ngOnInit(): void {
    this.types$   = this.store.select(selectAllTypes);
    this.loading$ = this.store.select(selectMetaLoading);
    this.store.dispatch(MetadataActions.loadTypes());
    this.initAttrForm();
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
      minLength:   [null],
      maxLength:   [null],
      placeholder: [''],
      hint:        [''],
      group:       [''],
      order:       [99],
    });
  }

  selectType(typeName: string): void {
    this.selectedTypeName = typeName;
    this.selectedType$ = this.store.select(selectTypeByName(typeName));
    this.showAddAttrForm = false;
    this.initAttrForm();
  }

  toggleAddAttrForm(): void {
    this.showAddAttrForm = !this.showAddAttrForm;
    if (!this.showAddAttrForm) this.initAttrForm();
  }

  submitAddAttr(): void {
    if (!this.selectedTypeName || this.addAttrForm.invalid) {
      this.addAttrForm.markAllAsTouched();
      return;
    }
    const raw = this.addAttrForm.value;
    const attribute: Partial<MetaAttribute> = {
      ...raw,
      min: raw.min !== null ? Number(raw.min) : undefined,
      max: raw.max !== null ? Number(raw.max) : undefined,
      minLength: raw.minLength !== null ? Number(raw.minLength) : undefined,
      maxLength: raw.maxLength !== null ? Number(raw.maxLength) : undefined,
    };
    this.store.dispatch(MetadataActions.addAttribute({ typeName: this.selectedTypeName, attribute }));
    this.showAddAttrForm = false;
    this.initAttrForm();
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
}
