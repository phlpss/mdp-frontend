import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MetaAttribute } from '@core/models/meta.model';
import { FilterParams } from '@core/models/api.model';
import { ApiService } from '@core/services/api.service';
import { selectFilterableAttributesForType } from '@store/metadata/metadata.selectors';

@Component({
  selector: 'mdp-meta-filter-bar',
  templateUrl: './meta-filter-bar.component.html',
  styleUrls: ['./meta-filter-bar.component.scss'],
})
export class MetaFilterBarComponent implements OnInit {
  @Input() typeName!: string;
  @Output() filtersChange = new EventEmitter<FilterParams>();

  filterForm!: FormGroup;
  filterAttributes: MetaAttribute[] = [];
  referenceOptions: Record<string, { id: string; label: string }[]> = {};

  constructor(private store: Store, private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.store.select(selectFilterableAttributesForType(this.typeName)).subscribe(attrs => {
      this.filterAttributes = attrs;
      const controls: Record<string, unknown> = {};
      attrs.forEach(attr => { controls[attr.name] = null; });
      this.filterForm = this.fb.group(controls);

      // Load options for reference filters (e.g. Location → store names)
      attrs.filter(a => a.fieldType === 'reference' && a.referenceType).forEach(attr => {
        this.api.getPage<any>(`entities/${attr.referenceType}`, { page: 0, size: 200 }, {})
          .subscribe(page => {
            this.referenceOptions[attr.name] = (page.content ?? []).map((it: any) => ({
              id: it.id,
              label: it.payload?.storeName ?? it.payload?.fullName ?? it.payload?.name ?? it.id,
            }));
          });
      });

      this.filterForm.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      ).subscribe(values => {
        const params: FilterParams = {};
        Object.entries(values as Record<string, unknown>).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            params[k] = v as string | number | boolean;
          }
        });
        this.filtersChange.emit(params);
      });
    });
  }

  reset(): void {
    this.filterForm.reset();
  }

  isEnum(attr: MetaAttribute): boolean { return attr.fieldType === 'enum'; }
  isDate(attr: MetaAttribute): boolean { return attr.fieldType === 'date' || attr.fieldType === 'datetime'; }
  isBool(attr: MetaAttribute): boolean { return attr.fieldType === 'boolean'; }
  isRef(attr: MetaAttribute): boolean { return attr.fieldType === 'reference'; }
  isText(attr: MetaAttribute): boolean { return !this.isEnum(attr) && !this.isDate(attr) && !this.isBool(attr) && !this.isRef(attr); }
}