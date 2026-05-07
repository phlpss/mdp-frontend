import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { User } from '../../core/models/user.model';

export interface AuthState {
  user: User | null;
  activeLocationId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  activeLocationId: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,

  on(AuthActions.login, state => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { response }) => ({
    ...state,
    user: response.user,
    activeLocationId: response.user.locationId,
    isAuthenticated: true,
    loading: false,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
  })),

  on(AuthActions.logout, state => ({ ...state, loading: true })),
  on(AuthActions.logoutSuccess, () => ({ ...initialState })),

  on(AuthActions.loadCurrentUser, state => ({ ...state, loading: true })),
  on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    activeLocationId: user.locationId,
    isAuthenticated: true,
    loading: false,
  })),
  on(AuthActions.loadCurrentUserFailure, state => ({
    ...state,
    loading: false,
    isAuthenticated: false,
  })),

  on(AuthActions.setActiveLocation, (state, { locationId }) => ({
    ...state,
    activeLocationId: locationId,
  })),
);
