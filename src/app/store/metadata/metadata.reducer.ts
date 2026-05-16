import { createReducer, on } from '@ngrx/store';
import { MetadataActions } from './metadata.actions';
import { MetaType } from '../../core/models/meta.model';

export interface MetadataState {
  types: Record<string, MetaType>;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: MetadataState = {
  types: {},
  loaded: false,
  loading: false,
  error: null,
};

export const metadataReducer = createReducer(
  initialState,

  on(MetadataActions.loadTypes, state => ({ ...state, loading: true, error: null })),
  on(MetadataActions.loadTypesSuccess, (state, { types }) => ({
    ...state,
    loading: false,
    loaded: true,
    types: types.reduce((acc, t) => ({ ...acc, [t.name]: t }), {} as Record<string, MetaType>),
  })),
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
