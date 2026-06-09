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
  fullWidth?: boolean;
  groupColumns?: number;
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
      // ── Personal Information ───────────────────────────────────────────
      { id: 'fullName', name: 'fullName', label: 'Full Name', fieldType: 'string',  required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1,  group: 'Personal Information' },
      { id: 'email',    name: 'email',    label: 'Email',     fieldType: 'email',   required: true,  sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 2,  group: 'Personal Information' },
      { id: 'phone',    name: 'phone',    label: 'Phone',     fieldType: 'phone',   required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 3,  group: 'Personal Information', fullWidth: true },

      // ── Employment Details ─────────────────────────────────────────────
      { id: 'role', name: 'role', label: 'Role', fieldType: 'enum', required: true, sensitive: false, sortable: true, filterable: true, showInList: true, showInForm: true, readOnly: false, order: 4, group: 'Employment Details',
        enumValues: [
          { value: 'BARISTA',          label: 'Barista',         color: '#9F6B53' },
          { value: 'CASHIER',          label: 'Cashier',         color: '#787774' },
          { value: 'STORE_MANAGER',    label: 'Store Manager',   color: '#337EA9' },
          { value: 'SHIFT_SUPERVISOR', label: 'Shift Supervisor', color: '#448361' },
          { value: 'HR_MANAGER',       label: 'HR Manager',      color: '#9065B0' },
          { value: 'ACCOUNTANT',       label: 'Accountant',      color: '#D9730D' },
          { value: 'BUSINESS_OWNER',   label: 'Business Owner',  color: '#337EA9' },
          { value: 'IT_SPECIALIST',    label: 'IT Specialist',   color: '#C14C8A' },
        ]
      },
      { id: 'hireDate',   name: 'hireDate',   label: 'Hire Date', fieldType: 'date',      required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 5,  group: 'Employment Details' },
      { id: 'locationId', name: 'locationId', label: 'Location',  fieldType: 'reference', required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 6,  group: 'Employment Details', referenceType: 'StoreLocation' },
      { id: 'skillLevel', name: 'skillLevel', label: 'Skill Level', fieldType: 'enum', required: false, sensitive: false, sortable: true, filterable: true, showInList: false, showInForm: true, readOnly: false, order: 7, group: 'Employment Details',
        enumValues: [
          { value: 'TRAINEE', label: 'Trainee', color: '#9e9e9e' },
          { value: 'JUNIOR',  label: 'Junior',  color: '#1976d2' },
          { value: 'MIDDLE',  label: 'Middle',  color: '#388e3c' },
          { value: 'SENIOR',  label: 'Senior',  color: '#7b1fa2' },
        ]
      },
      { id: 'employmentType', name: 'employmentType', label: 'Employment Type', fieldType: 'enum', required: false, sensitive: false, sortable: true, filterable: true, showInList: false, showInForm: true, readOnly: false, order: 8, group: 'Employment Details',
        enumValues: [
          { value: 'FULL_TIME',   label: 'Full-Time',   color: '#388e3c' },
          { value: 'PART_TIME',   label: 'Part-Time',   color: '#1976d2' },
          { value: 'CONTRACT',    label: 'Contract',    color: '#D9730D' },
          { value: 'HOURLY',      label: 'Hourly',      color: '#9065B0' },
          { value: 'INTERN',      label: 'Intern',      color: '#787774' },
          { value: 'FREELANCE',   label: 'Freelance',   color: '#C14C8A' },
        ]
      },
      { id: 'jobStatus', name: 'jobStatus', label: 'Job Status', fieldType: 'enum', required: false, sensitive: false, sortable: true, filterable: true, showInList: false, showInForm: true, readOnly: false, order: 9, group: 'Employment Details',
        enumValues: [
          { value: 'PROBATION',   label: 'Probation',    color: '#f57c00' },
          { value: 'ACTIVE',      label: 'Active',       color: '#388e3c' },
          { value: 'ON_LEAVE',    label: 'On Leave',     color: '#1976d2' },
          { value: 'SUSPENDED',   label: 'Suspended',    color: '#e53935' },
          { value: 'TERMINATED',  label: 'Terminated',   color: '#9e9e9e' },
        ]
      },
      { id: 'paymentType', name: 'paymentType', label: 'Payment Type', fieldType: 'enum', required: false, sensitive: false, sortable: true, filterable: true, showInList: false, showInForm: true, readOnly: false, order: 10, group: 'Employment Details',
        enumValues: [
          { value: 'MONTHLY_SALARY', label: 'Monthly Salary', color: '#388e3c' },
          { value: 'HOURLY_RATE',    label: 'Hourly Rate',    color: '#1976d2' },
          { value: 'COMMISSION',     label: 'Commission',     color: '#D9730D' },
          { value: 'STIPEND',        label: 'Stipend',        color: '#787774' },
        ]
      },
      // Visible only when paymentType === 'MONTHLY_SALARY' (enforced in dialog)
      { id: 'monthlySalary', name: 'monthlySalary', label: 'Monthly Salary', fieldType: 'currency', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 11, group: 'Employment Details', min: 0,
        hint: 'Fixed monthly compensation'
      },
      // Visible only when paymentType === 'HOURLY_RATE' or employmentType === 'HOURLY' (enforced in dialog)
      { id: 'hourlyRate', name: 'hourlyRate', label: 'Hourly Rate', fieldType: 'currency', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 12, group: 'Employment Details', min: 0,
        hint: 'Rate per hour worked'
      },
      // isActive moved to bottom of Employment Details
      { id: 'isActive', name: 'isActive', label: 'Active', fieldType: 'boolean', required: true, sensitive: false, sortable: false, filterable: true, showInList: true, showInForm: true, readOnly: false, order: 13, group: 'Employment Details', defaultValue: true },

      // ── Emergency Contact ──────────────────────────────────────────────
      { id: 'emergencyName',  name: 'emergencyName',  label: 'Contact Name',         fieldType: 'string', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 14, group: 'Emergency Contact' },
      { id: 'emergencyPhone', name: 'emergencyPhone', label: 'Contact Phone',        fieldType: 'phone',  required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 15, group: 'Emergency Contact' },
      { id: 'emergencyRel',   name: 'emergencyRel',   label: 'Relationship',         fieldType: 'string', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 16, group: 'Emergency Contact', fullWidth: true },

      // ── Leave Balances ─────────────────────────────────────────────────
      { id: 'ptoBalance',     name: 'ptoBalance',     label: 'PTO Balance (days)',     fieldType: 'number', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 17, group: 'Leave Balances', min: 0, defaultValue: 20, groupColumns: 3 },
      { id: 'sickBalance',    name: 'sickBalance',    label: 'Sick Balance (days)',    fieldType: 'number', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 18, group: 'Leave Balances', min: 0, defaultValue: 10, groupColumns: 3 },
      { id: 'holidayBalance', name: 'holidayBalance', label: 'Holiday Balance (days)', fieldType: 'number', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 19, group: 'Leave Balances', min: 0, defaultValue: 10, groupColumns: 3 },
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
      { id: 'employeeId',  name: 'employeeId',  label: 'Employee',     fieldType: 'reference', required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1, referenceType: 'Employee' },
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
      { id: 'leaveType',       name: 'leaveType',       label: 'Leave Type', fieldType: 'enum',      required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 2,
        enumValues: [
          { value: 'PTO',       label: 'Annual / PTO' },
          { value: 'SICK',      label: 'Sick Leave' },
          { value: 'HOLIDAY',   label: 'Holiday' },
          { value: 'UNPAID',    label: 'Unpaid Leave' },
          { value: 'MATERNITY', label: 'Maternity Leave' },
          { value: 'PATERNITY', label: 'Paternity Leave' },
          { value: 'OTHER',     label: 'Other' },
        ]
      },
      { id: 'startDate',  name: 'startDate',  label: 'Start Date', fieldType: 'date',     required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 3 },
      { id: 'endDate',    name: 'endDate',    label: 'End Date',   fieldType: 'date',     required: true,  sensitive: false, sortable: true,  filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 4 },
      { id: 'notes',       name: 'notes',       label: 'Notes',      fieldType: 'text',     required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true,  readOnly: false, order: 5 },
      { id: 'leaveStatus', name: 'leaveStatus', label: 'Status',     fieldType: 'enum',     required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: false, readOnly: true,  order: 6,
        enumValues: [
          { value: 'PENDING',              label: 'Pending',              color: '#f57c00' },
          { value: 'APPROVED',             label: 'Approved',             color: '#388e3c' },
          { value: 'REJECTED',             label: 'Rejected',             color: '#e53935' },
          { value: 'CANCELLED',            label: 'Cancelled',            color: '#9e9e9e' },
          { value: 'PENDING_CANCELLATION', label: 'Pending Cancellation', color: '#ab47bc' },
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
      { id: 'cashierId',     name: 'cashierId',     label: 'Cashier',      fieldType: 'reference', required: true, sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: false, readOnly: true,  order: 4, referenceType: 'Employee' },
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
      { id: 'approvedBy',  name: 'approvedBy',  label: 'Approved By',  fieldType: 'reference', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: false, readOnly: true, order: 5, referenceType: 'Employee' },
    ]
  },
  {
    id: 'InventoryItem',
    name: 'InventoryItem',
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
      { id: 'unitCost',    name: 'unitCost',    label: 'Unit Cost',  fieldType: 'currency', required: false, sensitive: false, sortable: false, filterable: false, showInList: false, showInForm: true, readOnly: false, order: 7, min: 0 },
    ]
  },
  {
    id: 'StoreLocation',
    name: 'StoreLocation',
    label: 'Location',
    pluralLabel: 'Locations',
    icon: 'store',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: [
      { id: 'storeName',  name: 'storeName',  label: 'Name',     fieldType: 'string',    required: true,  sensitive: false, sortable: true,  filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 1 },
      { id: 'address',    name: 'address',    label: 'Address',  fieldType: 'string',    required: true,  sensitive: false, sortable: false, filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 2 },
      { id: 'phone',      name: 'phone',      label: 'Phone',    fieldType: 'phone',     required: false, sensitive: false, sortable: false, filterable: false, showInList: true,  showInForm: true,  readOnly: false, order: 3 },
      { id: 'isActive',   name: 'isActive',   label: 'Active',   fieldType: 'boolean',   required: true,  sensitive: false, sortable: false, filterable: true,  showInList: true,  showInForm: true,  readOnly: false, order: 4, defaultValue: true },
      { id: 'manager',    name: 'manager',    label: 'Store Manager',  fieldType: 'reference', required: false, sensitive: false, sortable: false, filterable: false, showInList: true, showInForm: true, readOnly: false, order: 5, referenceType: 'Employee' },
    ]
  },
];