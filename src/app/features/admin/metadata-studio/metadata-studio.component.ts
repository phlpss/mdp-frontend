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
import { ApiService } from '../../../core/services/api.service';
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
  generatedCypher: string | null = null;
  cypherCopied = false;
  metadataActions = MetadataActions;   // expose for template

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
      this.addAttrForm.markAllAsTouched(); return;
    }
    const v = this.addAttrForm.value;
    this.generatedCypher =
        `MATCH (t:MetaType {name: "${this.selectedTypeName}"})\n` +
        `CREATE (t)-[:HAS_ATTRIBUTE]->(:MetaAttribute {\n` +
        `  name: "${v.name}", dataType: "${v.fieldType}", mandatory: ${v.required}` +
        (v.sensitive ? `, sensitive: true` : '') +
        (v.min !== null ? `, min: ${v.min}` : '') +
        (v.max !== null ? `, max: ${v.max}` : '') +
        `\n})`;
    this.showAddAttrForm = false;
    this.initAttrForm();
  }

  copyCypher(): void {
    navigator.clipboard.writeText(this.generatedCypher ?? '');
    this.cypherCopied = true;
    setTimeout(() => this.cypherCopied = false, 2000);
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

  sortedAttributes(attrs: MetaAttribute[]): MetaAttribute[] {
    return [...attrs].sort((a, b) => a.order - b.order);
  }
}
