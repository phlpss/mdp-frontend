import { createReducer, on } from '@ngrx/store';
import { MetadataActions } from './metadata.actions';
import { MetaType, MetaAttribute, FieldType, BUILTIN_META_TYPES } from '../../core/models/meta.model';

export interface MetadataState {
  types: Record<string, MetaType>;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}


const PASCAL: Record<string, string> = {
  employee: 'Employee', shift: 'Shift', leave_request: 'LeaveRequest',
  transaction: 'Transaction', expense: 'Expense',
  inventory_item: 'InventoryItem', location: 'StoreLocation',
};

const DATA_TYPE_MAP: Record<string, FieldType> = {
  STRING: 'string', INTEGER: 'number', DECIMAL: 'currency', NUMBER: 'number',
  BOOLEAN: 'boolean', DATE: 'date', DATETIME: 'datetime', ENUM: 'enum',
};

function toDisplayLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function backendAttrToMeta(ba: any, order: number, sensitive: boolean): MetaAttribute {
  return {
    id: ba.name,
    name: ba.name,
    label: toDisplayLabel(ba.name),
    fieldType: DATA_TYPE_MAP[(ba.dataType ?? '').toUpperCase()] ?? 'string',
    required: !!ba.mandatory,
    sensitive,
    sortable: true,
    filterable: false,
    showInList: false,
    showInForm: true,
    readOnly: false,
    order,
    min: ba.min ?? undefined,
    max: ba.max ?? undefined,
    enumValues: ba.allowedValues?.length
      ? ba.allowedValues.map((v: string) => ({ value: v, label: toDisplayLabel(v) }))
      : undefined,
  };
}
const builtinTypes: Record<string, MetaType> = BUILTIN_META_TYPES.reduce(
    (acc, t) => ({ ...acc, [PASCAL[t.name] ?? t.name]: { ...t, name: PASCAL[t.name] ?? t.name } }),
    {} as Record<string, MetaType>
);
const initialState: MetadataState = {
  types: builtinTypes,
  loaded: false,
  loading: false,
  error: null,
};

export const metadataReducer = createReducer(
    initialState,

    on(MetadataActions.loadTypes, state => ({ ...state, loading: true, error: null })),
    on(MetadataActions.loadTypesSuccess, (state, { types }) => {
      const merged = { ...state.types };
      types.forEach((t: any) => {
        const key = PASCAL[t.name] ?? t.name;
        const existing = merged[key];

        // Fallback stubs (from catchError) already have rich attrs — use as-is
        if (t.attributes?.some((a: any) => a.showInForm !== undefined)) {
          merged[key] = { ...t, name: key };
          return;
        }

        const backendAttrs: any[] = t.attributes ?? [];
        if (backendAttrs.length === 0) return; // No attrs from Neo4j yet — keep whatever we have

        const sensitiveSet = new Set<string>(t.sensitiveFields ?? []);

        if (existing) {
          // Keep ALL builtin attrs (preserving showInList/showInForm/etc.), only update sensitive.
          // Append any backend-only attrs that have no builtin counterpart.
          const builtinNames = new Set<string>(existing.attributes.map(a => a.name));
          const updatedBuiltins = existing.attributes.map(a => ({
            ...a,
            sensitive: sensitiveSet.has(a.name),
          }));
          const newFromBackend = backendAttrs
            .filter((ba: any) => !builtinNames.has(ba.name))
            .map((ba: any, i: number) =>
              backendAttrToMeta(ba, existing.attributes.length + i + 1, sensitiveSet.has(ba.name))
            );
          merged[key] = { ...existing, attributes: [...updatedBuiltins, ...newFromBackend] };
        } else {
          // New type from Neo4j not in builtins — create minimal entry
          merged[key] = {
            id: t.name,
            name: key,
            label: toDisplayLabel(t.name),
            pluralLabel: toDisplayLabel(t.name) + 's',
            icon: 'table_chart',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            attributes: backendAttrs.map((ba: any, i: number) =>
              backendAttrToMeta(ba, i + 1, sensitiveSet.has(ba.name))
            ),
          };
        }
      });
      return { ...state, loading: false, loaded: true, types: merged };
    }),
    on(MetadataActions.loadTypesFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(MetadataActions.createTypeSuccess, (state, { metaType }) => ({
      ...state,
      types: {
        ...state.types,
        [metaType.name]: metaType
      },
    })),

    on(MetadataActions.addAttributeSuccess, (state, { typeName, attribute }) => {
      const existing = state.types[typeName];
      if (!existing) return state;
      return {
        ...state,
        types: {
          ...state.types,
          [typeName]: { ...existing, attributes: [...existing.attributes, attribute] },
        },
      };
    }),

    on(MetadataActions.updateAttributeSuccess, (state, { typeName, attribute }) => {
      const existing = state.types[typeName];
      if (!existing) return state;
      return {
        ...state,
        types: {
          ...state.types,
          [typeName]: {
            ...existing,
            attributes: existing.attributes.map(a => a.name === attribute.name ? attribute : a),
          },
        },
      };
    }),

    on(MetadataActions.deleteAttributeSuccess, (state, { typeName, attrName }) => {
      const existing = state.types[typeName];
      if (!existing) return state;
      return {
        ...state,
        types: {
          ...state.types,
          [typeName]: {
            ...existing,
            attributes: existing.attributes.filter(a => a.name !== attrName),
          },
        },
      };
    }),
);