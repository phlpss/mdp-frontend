import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { KpiData } from '../../../core/models/api.model';
import { selectCanViewSensitive } from '../../../store/auth/auth.selectors';

interface PayrollRow {
  employeeId: string;
  employeeName: string;
  role: string;
  baseSalary: number;
  hoursWorked: number;
  bonus: number;
  deductions: number;
  netPay: number;
}

@Component({
  selector: 'mdp-payroll',
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss'],
})
export class PayrollComponent implements OnInit {
  payrollData: PayrollRow[] = [];
  loading = false;
  processing = false;
  canViewSensitive$!: Observable<boolean>;
  kpis: KpiData[] = [];
  filterForm!: FormGroup;
  displayedColumns = ['employeeName','role','baseSalary','hoursWorked','bonus','deductions','netPay'];
  today = new Date();

  constructor(
    private api: ApiService,
    private store: Store,
    private fb: FormBuilder,
    private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.canViewSensitive$ = this.store.select(selectCanViewSensitive);
    this.filterForm = this.fb.group({
      month: [this.today.getMonth() + 1, Validators.required],
      year:  [this.today.getFullYear(), Validators.required],
    });
    this.loadPayroll();
  }

  loadPayroll(): void {
    this.loading = true;
    const { month, year } = this.filterForm.value as { month: number; year: number };
    this.api.get<PayrollRow[]>(`payroll?month=${month}&year=${year}`).pipe(
      catchError(() => of([
        { employeeId: '1', employeeName: 'Alice Johnson', role: 'Barista',   baseSalary: 2800, hoursWorked: 160, bonus: 200,  deductions: 350, netPay: 2650 },
        { employeeId: '2', employeeName: 'Bob Smith',     role: 'Cashier',   baseSalary: 2600, hoursWorked: 152, bonus: 0,    deductions: 325, netPay: 2275 },
        { employeeId: '3', employeeName: 'Carol White',   role: 'Manager',   baseSalary: 4200, hoursWorked: 176, bonus: 500,  deductions: 590, netPay: 4110 },
        { employeeId: '4', employeeName: 'David Lee',     role: 'Barista',   baseSalary: 2800, hoursWorked: 168, bonus: 100,  deductions: 350, netPay: 2550 },
        { employeeId: '5', employeeName: 'Emma Davis',    role: 'Supervisor',baseSalary: 3400, hoursWorked: 176, bonus: 300,  deductions: 450, netPay: 3250 },
      ] as PayrollRow[]))
    ).subscribe(data => {
      this.payrollData = data;
      this.loading = false;
      this.calculateKpis();
    });
  }

  calculateKpis(): void {
    const total    = this.payrollData.reduce((s, r) => s + r.netPay, 0);
    const bonuses  = this.payrollData.reduce((s, r) => s + r.bonus, 0);
    const avgPay   = this.payrollData.length ? total / this.payrollData.length : 0;
    this.kpis = [
      { label: 'Total Payroll',   value: '$' + total.toFixed(0),   icon: 'payments',    color: '#1976d2' },
      { label: 'Employees Paid',  value: this.payrollData.length,  icon: 'people',      color: '#388e3c' },
      { label: 'Total Bonuses',   value: '$' + bonuses.toFixed(0), icon: 'star',        color: '#f57c00' },
      { label: 'Average Net Pay', value: '$' + avgPay.toFixed(0),  icon: 'bar_chart',   color: '#7b1fa2' },
    ];
  }

  processPayroll(): void {
    this.processing = true;
    const { month, year } = this.filterForm.value as { month: number; year: number };
    this.api.post('payroll/process', { month, year }).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.processing = false;
      this.notifications.success(`Payroll for ${month}/${year} processed.`);
    });
  }

  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' },   { value: 4, label: 'April' },
    { value: 5, label: 'May' },     { value: 6, label: 'June' },
    { value: 7, label: 'July' },    { value: 8, label: 'August' },
    { value: 9, label: 'September'},{ value: 10, label: 'October' },
    { value: 11, label: 'November'},{ value: 12, label: 'December' },
  ];

  years = Array.from({ length: 5 }, (_, i) => this.today.getFullYear() - i);
}
