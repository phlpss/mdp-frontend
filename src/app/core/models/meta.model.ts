export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'email'
  | 'phone'
  | 'currency'
  | 'text'
  | 'file'
  | 'reference';

export interface MetaAttribute {
  id: string;
  name: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  sensitive: boolean;
  sortable: boolean;
  filterable: boolean;
  showInList: boolean;
  showInForm: boolean;
  readOnly: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enumValues?: EnumValue[];
  referenceType?: string;
  defaultValue?: unknown;
  placeholder?: string;
  hint?: string;
  order: number;
  group?: string;
}

export interface EnumValue {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export interface MetaType {
  id: string;
  name: string;
  label: string;
  pluralLabel: string;
  description?: string;
  icon?: string;
  attributes: MetaAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface MetaState {
  types: Record<string, MetaType>;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

// Built-in metadata stubs for offline/dev
export const BUILTIN_META_TYPES: MetaType[] = [
  {
    id: 'employee',
    name: 'employee',
    label: 'Employee',
    pluralLabel: 'Employees',
    icon: 'people',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'firstName',   name: 'firstName',   label: 'First Name',   fieldType: 'string',   required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1 },
      { id: 'lastName',    name: 'lastName',    label: 'Last Name',    fieldType: 'string',   required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 2 },
      { id: 'email',       name: 'email',       label: 'Email',        fieldType: 'email',    required: true,  sensitive: true,  sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 3 },
      { id: 'phone',       name: 'phone',       label: 'Phone',        fieldType: 'phone',    required: false, sensitive: true,  sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 4 },
      { id: 'role',        name: 'role',        label: 'Role',         fieldType: 'enum',     required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 5,
        enumValues: [
          { value: 'BARISTA',     label: 'Barista',     color: '#795548' },
          { value: 'CASHIER',     label: 'Cashier',     color: '#607d8b' },
          { value: 'MANAGER',     label: 'Manager',     color: '#1976d2' },
          { value: 'SUPERVISOR',  label: 'Supervisor',  color: '#388e3c' },
          { value: 'HR',          label: 'HR',          color: '#7b1fa2' },
          { value: 'ACCOUNTANT',  label: 'Accountant',  color: '#f57c00' },
        ]
      },
      { id: 'salary',      name: 'salary',      label: 'Salary',       fieldType: 'currency', required: false, sensitive: true,  sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 6, min: 0 },
      { id: 'hireDate',    name: 'hireDate',    label: 'Hire Date',    fieldType: 'date',     required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 7 },
      { id: 'isActive',    name: 'isActive',    label: 'Active',       fieldType: 'boolean',  required: true,  sensitive: false, sortable: false, filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 8, defaultValue: true },
      { id: 'locationId',  name: 'locationId',  label: 'Location',     fieldType: 'reference', required: true, sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 9, referenceType: 'location' },
    ]
  },
  {
    id: 'shift',
    name: 'shift',
    label: 'Shift',
    pluralLabel: 'Shifts',
    icon: 'schedule',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'employeeId',  name: 'employeeId',  label: 'Employee',     fieldType: 'reference', required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1, referenceType: 'employee' },
      { id: 'date',        name: 'date',        label: 'Date',         fieldType: 'date',      required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 2 },
      { id: 'startTime',   name: 'startTime',   label: 'Start Time',   fieldType: 'string',    required: true,  sensitive: false, sortable: false, filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 3, placeholder: 'HH:mm' },
      { id: 'endTime',     name: 'endTime',     label: 'End Time',     fieldType: 'string',    required: true,  sensitive: false, sortable: false, filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 4, placeholder: 'HH:mm' },
      { id: 'status',      name: 'status',      label: 'Status',       fieldType: 'enum',      required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 5,
        enumValues: [
          { value: 'SCHEDULED', label: 'Scheduled', color: '#1976d2' },
          { value: 'COMPLETED', label: 'Completed', color: '#388e3c' },
          { value: 'CANCELLED', label: 'Cancelled', color: '#e53935' },
          { value: 'NO_SHOW',   label: 'No Show',   color: '#f57c00' },
        ]
      },
      { id: 'notes', name: 'notes', label: 'Notes', fieldType: 'text', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 6 },
    ]
  },
  {
    id: 'leave_request',
    name: 'leave_request',
    label: 'Leave Request',
    pluralLabel: 'Leave Requests',
    icon: 'event_busy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'employeeId', name: 'employeeId', label: 'Employee',   fieldType: 'reference', required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1, referenceType: 'employee' },
      { id: 'type',       name: 'type',       label: 'Leave Type', fieldType: 'enum',      required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 2,
        enumValues: [
          { value: 'ANNUAL',   label: 'Annual Leave' },
          { value: 'SICK',     label: 'Sick Leave' },
          { value: 'UNPAID',   label: 'Unpaid Leave' },
          { value: 'MATERNITY', label: 'Maternity Leave' },
          { value: 'PATERNITY', label: 'Paternity Leave' },
          { value: 'OTHER',    label: 'Other' },
        ]
      },
      { id: 'startDate',  name: 'startDate',  label: 'Start Date', fieldType: 'date',     required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 3 },
      { id: 'endDate',    name: 'endDate',    label: 'End Date',   fieldType: 'date',     required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 4 },
      { id: 'reason',     name: 'reason',     label: 'Reason',     fieldType: 'text',     required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 5 },
      { id: 'status',     name: 'status',     label: 'Status',     fieldType: 'enum',     required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: false, readOnly: true,  order: 6,
        enumValues: [
          { value: 'PENDING',   label: 'Pending',  color: '#f57c00' },
          { value: 'APPROVED',  label: 'Approved', color: '#388e3c' },
          { value: 'REJECTED',  label: 'Rejected', color: '#e53935' },
        ]
      },
    ]
  },
  {
    id: 'transaction',
    name: 'transaction',
    label: 'Transaction',
    pluralLabel: 'Transactions',
    icon: 'point_of_sale',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'receiptNumber', name: 'receiptNumber', label: 'Receipt #',    fieldType: 'string',   required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: false, readOnly: true,  order: 1 },
      { id: 'amount',        name: 'amount',        label: 'Amount',       fieldType: 'currency', required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 2, min: 0 },
      { id: 'paymentMethod', name: 'paymentMethod', label: 'Payment',      fieldType: 'enum',     required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 3,
        enumValues: [
          { value: 'CASH',   label: 'Cash',   color: '#388e3c' },
          { value: 'CARD',   label: 'Card',   color: '#1976d2' },
          { value: 'MOBILE', label: 'Mobile', color: '#7b1fa2' },
        ]
      },
      { id: 'cashierId',     name: 'cashierId',     label: 'Cashier',      fieldType: 'reference', required: true, sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: false, readOnly: true,  order: 4, referenceType: 'employee' },
      { id: 'createdAt',     name: 'createdAt',     label: 'Date/Time',    fieldType: 'datetime', required: false, sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: false, readOnly: true,  order: 5 },
      { id: 'notes',         name: 'notes',         label: 'Notes',        fieldType: 'text',     required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 6 },
    ]
  },
  {
    id: 'expense',
    name: 'expense',
    label: 'Expense',
    pluralLabel: 'Expenses',
    icon: 'receipt_long',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'description', name: 'description', label: 'Description',  fieldType: 'string',   required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 1 },
      { id: 'category',    name: 'category',    label: 'Category',     fieldType: 'enum',     required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 2,
        enumValues: [
          { value: 'SUPPLIES',    label: 'Supplies' },
          { value: 'UTILITIES',   label: 'Utilities' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
          { value: 'MARKETING',   label: 'Marketing' },
          { value: 'FOOD_COST',   label: 'Food Cost' },
          { value: 'OTHER',       label: 'Other' },
        ]
      },
      { id: 'amount',      name: 'amount',      label: 'Amount',       fieldType: 'currency', required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 3, min: 0 },
      { id: 'date',        name: 'date',        label: 'Date',         fieldType: 'date',     required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 4 },
      { id: 'approvedBy',  name: 'approvedBy',  label: 'Approved By',  fieldType: 'reference', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: false, readOnly: true, order: 5, referenceType: 'employee' },
    ]
  },
  {
    id: 'inventory_item',
    name: 'inventory_item',
    label: 'Inventory Item',
    pluralLabel: 'Inventory',
    icon: 'inventory_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'name',       name: 'name',       label: 'Item Name',  fieldType: 'string',  required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1 },
      { id: 'sku',        name: 'sku',        label: 'SKU',        fieldType: 'string',  required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 2 },
      { id: 'category',   name: 'category',   label: 'Category',   fieldType: 'enum',   required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 3,
        enumValues: [
          { value: 'COFFEE_BEANS', label: 'Coffee Beans' },
          { value: 'MILK',         label: 'Milk & Dairy' },
          { value: 'SYRUPS',       label: 'Syrups' },
          { value: 'CUPS',         label: 'Cups & Lids' },
          { value: 'FOOD',         label: 'Food Items' },
          { value: 'CLEANING',     label: 'Cleaning' },
          { value: 'OTHER',        label: 'Other' },
        ]
      },
      { id: 'quantity',    name: 'quantity',    label: 'Quantity',   fieldType: 'number', required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 4, min: 0 },
      { id: 'unit',        name: 'unit',        label: 'Unit',       fieldType: 'string', required: true,  sensitive: false, sortable: false, filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 5 },
      { id: 'reorderLevel', name: 'reorderLevel', label: 'Reorder At', fieldType: 'number', required: true, sensitive: false, sortable: false, filterable: false, showInList: true, showInForm: true, readOnly: false, order: 6, min: 0 },
      { id: 'unitCost',    name: 'unitCost',    label: 'Unit Cost',  fieldType: 'currency', required: false, sensitive: true, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 7, min: 0 },
    ]
  },
  {
    id: 'location',
    name: 'location',
    label: 'Location',
    pluralLabel: 'Locations',
    icon: 'store',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'name',     name: 'name',     label: 'Name',     fieldType: 'string',  required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1 },
      { id: 'address',  name: 'address',  label: 'Address',  fieldType: 'string',  required: true,  sensitive: false, sortable: false, filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 2 },
      { id: 'phone',    name: 'phone',    label: 'Phone',    fieldType: 'phone',   required: false, sensitive: false, sortable: false, filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 3 },
      { id: 'isActive', name: 'isActive', label: 'Active',   fieldType: 'boolean', required: true,  sensitive: false, sortable: false, filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 4, defaultValue: true },
      { id: 'manager',  name: 'manager',  label: 'Manager',  fieldType: 'reference', required: false, sensitive: false, sortable: false, filterable: false, showInList: true, showInForm: true, readOnly: false, order: 5, referenceType: 'employee' },
    ]
  },
];
