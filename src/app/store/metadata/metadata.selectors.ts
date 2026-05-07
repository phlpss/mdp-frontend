import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MetadataState } from './metadata.reducer';

export const selectMetadataState = createFeatureSelector<MetadataState>('metadata');

export const selectAllTypes    = createSelector(selectMetadataState, s => Object.values(s.types));
export const selectTypesMap    = createSelector(selectMetadataState, s => s.types);
export const selectMetaLoaded  = createSelector(selectMetadataState, s => s.loaded);
export const selectMetaLoading = createSelector(selectMetadataState, s => s.loading);

export const selectTypeByName = (name: string) =>
  createSelector(selectTypesMap, types => types[name] ?? null);

export const selectAttributesForType = (typeName: string) =>
  createSelector(
    selectTypeByName(typeName),
    type => type?.attributes.slice().sort((a, b) => a.order - b.order) ?? []
  );

export const selectListAttributesForType = (typeName: string) =>
  createSelector(
    selectAttributesForType(typeName),
    attrs => attrs.filter(a => a.showInList)
  );

export const selectFormAttributesForType = (typeName: string) =>
  createSelector(
    selectAttributesForType(typeName),
    attrs => attrs.filter(a => a.showInForm)
  );

export const selectFilterableAttributesForType = (typeName: string) =>
  createSelector(
    selectAttributesForType(typeName),
    attrs => attrs.filter(a => a.filterable)
  );
