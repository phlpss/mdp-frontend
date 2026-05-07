import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UiState } from './ui.reducer';

export const selectUiState    = createFeatureSelector<UiState>('ui');
export const selectLoading    = createSelector(selectUiState, s => s.loading);
export const selectError      = createSelector(selectUiState, s => s.error);
export const selectSidebarOpen = createSelector(selectUiState, s => s.sidebarOpen);
export const selectPageTitle  = createSelector(selectUiState, s => s.pageTitle);
