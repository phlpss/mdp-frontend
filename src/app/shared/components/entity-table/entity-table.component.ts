import {
  Component, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, ViewChild
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { FilterParams, PageRequest, PageResponse } from '../../../core/models/api.model';
import { MetaAttribute } from '../../../core/models/meta.model';
import { selectListAttributesForType } from '../../../store/metadata/metadata.selectors';
import { selectCanViewSensitive } from '../../../store/auth/auth.selectors';

export interface TableAction {
  icon: string;
  label: string;
  color?: string;
  handler: (row: unknown) => void;
  hidden?: (row: unknown) => boolean;
}

@Component({
  selector: 'mdp-entity-table',
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss'],
})
export class EntityTableComponent implements OnInit, OnChanges {
  @Input() typeName!: string;
  @Input() apiPath!: string;
  @Input() filters: FilterParams = {};
  @Input() actions: TableAction[] = [];
  @Input() selectable = false;
  @Output() rowClick      = new EventEmitter<unknown>();
  @Output() selectionChange = new EventEmitter<unknown[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  data: unknown[]   = [];
  totalElements     = 0;
  loading           = false;
  displayedColumns: string[] = [];
  attributes: MetaAttribute[]  = [];
  canViewSensitive  = false;
  pageSize          = 10;
  pageIndex         = 0;
  sortField         = '';
  sortDir: 'asc'|'desc' = 'asc';
  selectedRows      = new Set<unknown>();
  referenceOptions: Record<string, Record<string, string>> = {}; // attrName -> { id: label }

  private reload$ = new Subject<void>();

  constructor(private store: Store, private api: ApiService) {}

  ngOnInit(): void {
    this.store.select(selectCanViewSensitive).subscribe(v => this.canViewSensitive = v);

    this.store.select(selectListAttributesForType(this.typeName)).subscribe(attrs => {
      this.attributes = attrs;
      this.buildColumns();
      attrs.filter(a => a.fieldType === 'reference' && a.referenceType).forEach(attr => {
        this.api.getPage<unknown>(`entities/${attr.referenceType}`, { page: 0, size: 100 }, {}).subscribe((page: any) => {
          const map: Record<string, string> = {};
          page.content.forEach((item: any) => {
            map[item.id] = item.payload?.name ?? item.payload?.fullName ?? item.id;
          });
          this.referenceOptions[attr.name] = map;
        });
      });
    });

    this.reload$.pipe(
        tap(() => this.loading = true),
        switchMap(() => {
          const req: PageRequest = {
            page: this.pageIndex,
            size: this.pageSize,
            sort: this.sortField || undefined,
            direction: this.sortDir,
          };
          return this.api.getPage<unknown>(this.apiPath, req, this.filters).pipe(
              catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size: this.pageSize, number: 0, first: true, last: true } as PageResponse<unknown>))
          );
        }),
        tap(() => this.loading = false)
    ).subscribe(page => {
      this.data = page.content;
      this.totalElements = page.totalElements;
    });

    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['filters'] || changes['apiPath']) && !changes['filters']?.firstChange) {
      this.pageIndex = 0;
      this.load();
    }
  }

  load(): void {
    this.reload$.next();
  }

  private buildColumns(): void {
    this.displayedColumns = this.attributes.map(a => a.name);
    if (this.selectable) this.displayedColumns = ['__select__', ...this.displayedColumns];
    if (this.actions.length) this.displayedColumns = [...this.displayedColumns, '__actions__'];
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.load();
  }

  onSort(event: Sort): void {
    this.sortField = event.active;
    this.sortDir   = event.direction as 'asc'|'desc' || 'asc';
    this.load();
  }

  onRowClick(row: unknown): void {
    if (this.rowClick.observed) this.rowClick.emit(row);
  }

  toggleSelect(row: unknown): void {
    if (this.selectedRows.has(row)) this.selectedRows.delete(row);
    else this.selectedRows.add(row);
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  isSelected(row: unknown): boolean {
    return this.selectedRows.has(row);
  }

  getCellValue(row: unknown, attr: MetaAttribute): string {
    const val = (row as Record<string, unknown>)[attr.name];
    if (val === null || val === undefined) return '—';
    if (attr.sensitive && !this.canViewSensitive) return '••••••';
    if (attr.fieldType === 'currency') return '$' + Number(val).toFixed(2);
    if (attr.fieldType === 'boolean') return val ? 'Yes' : 'No';
    if (attr.fieldType === 'enum' && attr.enumValues) {
      return attr.enumValues.find(e => e.value === String(val))?.label ?? String(val);
    }
    if (attr.fieldType === 'date' || attr.fieldType === 'datetime') {
      return val ? new Date(String(val)).toLocaleDateString() : '—';
    }
    if (attr.fieldType === 'reference') {
      return this.referenceOptions[attr.name]?.[String(val)] ?? String(val);
    }
    return String(val);
  }

  getEnumColor(row: unknown, attr: MetaAttribute): string {
    const val = (row as Record<string, unknown>)[attr.name];
    if (!val || !attr.enumValues) return '';
    return attr.enumValues.find(e => e.value === String(val))?.color ?? '';
  }

  visibleActions(row: unknown): TableAction[] {
    return this.actions.filter(a => !a.hidden || !a.hidden(row));
  }
}