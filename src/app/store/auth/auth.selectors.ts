import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';
import { canViewSensitive, hasRole, UserRole } from '../../core/models/user.model';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser      = createSelector(selectAuthState, s => s.user);
export const selectIsAuthenticated  = createSelector(selectAuthState, s => s.isAuthenticated);
export const selectAuthLoading      = createSelector(selectAuthState, s => s.loading);
export const selectAuthError        = createSelector(selectAuthState, s => s.error);
export const selectActiveLocationId = createSelector(selectAuthState, s => s.activeLocationId);

export const selectUserRoles = createSelector(selectCurrentUser, user => user?.roles ?? []);

export const selectCanViewSensitive = createSelector(
  selectCurrentUser,
  user => canViewSensitive(user)
);

export const selectHasRole = (...roles: UserRole[]) =>
  createSelector(selectCurrentUser, user => hasRole(user, ...roles));

export const selectUserDisplayName = createSelector(
  selectCurrentUser,
  user => user ? `${user.firstName} ${user.lastName}` : ''
);
