export type UserRole =
  | 'EMPLOYEE'
  | 'BARISTA'
  | 'CASHIER'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'HR'
  | 'ACCOUNTANT'
  | 'OWNER'
  | 'IT_ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  locationId: string | null;
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  EMPLOYEE:   1,
  BARISTA:    1,
  CASHIER:    1,
  SUPERVISOR: 2,
  MANAGER:    3,
  HR:         3,
  ACCOUNTANT: 3,
  OWNER:      5,
  IT_ADMIN:   5,
};

export const SENSITIVE_ROLES: UserRole[] = ['HR', 'ACCOUNTANT', 'OWNER', 'IT_ADMIN'];

export function hasRole(user: User | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.some(r => user.roles.includes(r));
}

export function canViewSensitive(user: User | null): boolean {
  return hasRole(user, ...SENSITIVE_ROLES);
}

export function getDisplayName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
