export type UserRole =
  | 'EMPLOYEE'
  | 'BARISTA'
  | 'CASHIER'
  | 'STORE_MANAGER'
  | 'HR_MANAGER'
  | 'ACCOUNTANT'
  | 'BUSINESS_OWNER'
  | 'SHIFT_SUPERVISOR'
  | 'IT_SPECIALIST';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
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
  EMPLOYEE: 1,
  BARISTA: 1,
  CASHIER: 1,
  SHIFT_SUPERVISOR: 2,
  STORE_MANAGER: 3,
  HR_MANAGER: 3,
  ACCOUNTANT: 3,
  BUSINESS_OWNER: 5,
  IT_SPECIALIST: 5,
};

export const SENSITIVE_ROLES: UserRole[] = ['HR_MANAGER', 'ACCOUNTANT', 'BUSINESS_OWNER', 'IT_SPECIALIST'];

export function hasRole(user: User | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.some(r => user.roles.includes(r));
}

export function canViewSensitive(user: User | null): boolean {
  return hasRole(user, ...SENSITIVE_ROLES);
}

export function getDisplayName(user: User): string {
  return user.fullName;
}