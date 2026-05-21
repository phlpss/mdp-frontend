import { createReducer, on } from '@ngrx/store';
import { MetadataActions } from './metadata.actions';
import { MetaType, BUILTIN_META_TYPES } from '../../core/models/meta.model';

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
      // Backend MetaAttribute is a minimal record (name/dataType/mandatory only).
      // Only replace a builtin if the backend type has rich attrs (showInForm defined).
      const merged = { ...state.types };
      types.forEach(t => {
        const hasRichAttrs = t.attributes?.some((a: any) => a.showInForm !== undefined);
        const key = PASCAL[t.name] ?? t.name;
        if (hasRichAttrs) merged[key] = { ...t, name: key };
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