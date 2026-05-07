import { createReducer, on } from '@ngrx/store';
import { UiActions } from './ui.actions';

export interface UiState {
  loading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  pageTitle: string;
}

const initialState: UiState = {
  loading: false,
  error: null,
  sidebarOpen: true,
  pageTitle: 'MDP Coffee',
};

export const uiReducer = createReducer(
  initialState,
  on(UiActions.setLoading,      (state, { loading })  => ({ ...state, loading })),
  on(UiActions.setError,        (state, { error })    => ({ ...state, error })),
  on(UiActions.clearError,      state                 => ({ ...state, error: null })),
  on(UiActions.toggleSidebar,   state                 => ({ ...state, sidebarOpen: !state.sidebarOpen })),
  on(UiActions.setSidebarOpen,  (state, { open })     => ({ ...state, sidebarOpen: open })),
  on(UiActions.setPageTitle,    (state, { title })    => ({ ...state, pageTitle: title })),
);
