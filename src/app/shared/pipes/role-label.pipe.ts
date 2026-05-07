import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../../core/models/user.model';

const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE:   'Employee',
  BARISTA:    'Barista',
  CASHIER:    'Cashier',
  SUPERVISOR: 'Supervisor',
  MANAGER:    'Manager',
  HR:         'HR',
  ACCOUNTANT: 'Accountant',
  OWNER:      'Owner',
  IT_ADMIN:   'IT Admin',
};

@Pipe({ name: 'roleLabel' })
export class RoleLabelPipe implements PipeTransform {
  transform(role: string): string {
    return ROLE_LABELS[role as UserRole] ?? role;
  }
}
