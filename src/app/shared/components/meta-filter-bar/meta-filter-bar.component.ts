import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MetaAttribute } from '@core/models/meta.model';
import { FilterParams } from '@core/models/api.model';
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

  constructor(private store: Store, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.store.select(selectFilterableAttributesForType(this.typeName)).subscribe(attrs => {
      this.filterAttributes = attrs;
      const controls: Record<string, unknown> = {};
      attrs.forEach(attr => { controls[attr.name] = null; });
      this.filterForm = this.fb.group(controls);

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
  isText(attr: MetaAttribute): boolean { return !this.isEnum(attr) && !this.isDate(attr) && !this.isBool(attr); }
}
