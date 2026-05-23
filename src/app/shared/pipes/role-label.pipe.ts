import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../../core/models/user.model';

const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE:         'Employee',
  BARISTA:          'Barista',
  CASHIER:          'Cashier',
  SHIFT_SUPERVISOR: 'Shift Supervisor',
  STORE_MANAGER:    'Store Manager',
  HR_MANAGER:       'HR Manager',
  ACCOUNTANT:       'Accountant',
  BUSINESS_OWNER:   'Business Owner',
  IT_SPECIALIST:    'IT Specialist',
};

@Pipe({ name: 'roleLabel' })
export class RoleLabelPipe implements PipeTransform {
  transform(role: string): string {
    return ROLE_LABELS[role as UserRole] ?? role;
  }
}
