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

function backendAttrToMeta(ba: any, order: number, sensitive: boolean, builtin?: MetaAttribute): MetaAttribute {
  return {
    id: ba.id ?? builtin?.id ?? ba.name,
    name: ba.name,
    label: ba.label ?? builtin?.label ?? toDisplayLabel(ba.name),
    fieldType: ba.fieldType ?? DATA_TYPE_MAP[(ba.dataType ?? '').toUpperCase()] ?? builtin?.fieldType ?? 'string',
    required: ba.required !== undefined ? !!ba.required : (ba.mandatory !== undefined ? !!ba.mandatory : (builtin?.required ?? false)),
    sensitive: ba.sensitive !== undefined ? !!ba.sensitive : sensitive,
    sortable: ba.sortable !== undefined ? !!ba.sortable : (builtin?.sortable ?? true),
    filterable: ba.filterable !== undefined ? !!ba.filterable : (builtin?.filterable ?? false),
    showInList: ba.showInList !== undefined ? !!ba.showInList : (builtin?.showInList ?? false),
    showInForm: ba.showInForm !== undefined ? !!ba.showInForm : (builtin?.showInForm ?? true),
    readOnly: ba.readOnly !== undefined ? !!ba.readOnly : (builtin?.readOnly ?? false),
    order: ba.order ?? builtin?.order ?? order,
    min: ba.min ?? builtin?.min,
    max: ba.max ?? builtin?.max,
    placeholder: ba.placeholder ?? builtin?.placeholder,
    hint: ba.hint ?? builtin?.hint,
    group: ba.group ?? builtin?.group,
    referenceType: ba.referenceType ?? builtin?.referenceType,
    defaultValue: ba.defaultValue ?? builtin?.defaultValue,
    fullWidth: ba.fullWidth ?? builtin?.fullWidth,
    groupColumns: ba.groupColumns ?? builtin?.groupColumns,
    // Prefer builtin enumValues (have colors/labels); fall back to allowedValues strings
    enumValues: builtin?.enumValues?.length
      ? builtin.enumValues
      : ba.enumValues?.length
        ? ba.enumValues
        : ba.allowedValues?.length
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

        // BUILTIN_META_TYPES stubs (from catchError) have fieldType on attrs — use as-is.
        // Backend data uses dataType instead of fieldType, so this check stays false for backend responses.
        if (t.attributes?.some((a: any) => a.fieldType !== undefined)) {
          merged[key] = { ...t, name: key };
          return;
        }

        const backendAttrs: any[] = t.attributes ?? [];
        if (backendAttrs.length === 0) return; // No attrs from Neo4j yet — keep whatever we have

        const sensitiveSet = new Set<string>(t.sensitiveFields ?? []);

        if (existing) {
          // Merge: backend attrs are authoritative for values; builtin provides enrichments
          // (enumValues with colors, referenceType, etc.) for attrs that exist in both.
          const builtinMap = new Map(existing.attributes.map(a => [a.name, a]));
          const updatedAttrs = backendAttrs.map((ba: any, i: number) =>
            backendAttrToMeta(ba, i + 1, sensitiveSet.has(ba.name), builtinMap.get(ba.name))
          );
          // Append any builtin-only attrs not present in backend response
          const backendNames = new Set(backendAttrs.map((ba: any) => ba.name));
          const builtinOnly = existing.attributes.filter(a => !backendNames.has(a.name));
          const allAttrs = [...updatedAttrs, ...builtinOnly].sort((a, b) => a.order - b.order);
          merged[key] = { ...existing, attributes: allAttrs };
        } else {
          // New type from Neo4j not in builtins — create minimal entry
          merged[key] = {
            id: t.name,
            name: key,
            label: t.label ?? toDisplayLabel(t.name),
            pluralLabel: t.pluralLabel ?? (toDisplayLabel(t.name) + 's'),
            icon: t.icon ?? 'table_chart',
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