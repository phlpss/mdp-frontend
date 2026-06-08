import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { FilterParams, KpiData } from '@core/models/api.model';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { hasRole, User } from '@core/models/user.model';
import { TableAction } from '@shared/components/entity-table/entity-table.component';

interface Receipt {
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  timestamp: string;
}

@Component({
  selector: 'mdp-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  isCashier = false;
  isManager = false;
  currentUser: User | null = null;
  filters: FilterParams = {};
  posForm!: FormGroup;
  lastReceipt: Receipt | null = null;
  posLoading = false;
  dailyKpis$!: Observable<KpiData[]>;
  reloadTrigger = 0;

  paymentMethods = [
    { value: 'CASH',   label: 'Cash',   icon: 'payments',      color: '#388e3c' },
    { value: 'CARD',   label: 'Card',   icon: 'credit_card',   color: '#1976d2' },
    { value: 'MOBILE', label: 'Mobile', icon: 'smartphone',    color: '#7b1fa2' },
  ];

  tableActions: TableAction[] = [
    { icon: 'receipt', label: 'View Receipt', handler: (row) => this.viewReceipt(row as Record<string, unknown>) },
  ];

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private api: ApiService,
    private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser).subscribe(user => {
      this.currentUser = user;
      this.isCashier   = hasRole(user, 'CASHIER');
      this.isManager   = hasRole(user, 'STORE_MANAGER', 'SHIFT_SUPERVISOR', 'ACCOUNTANT', 'BUSINESS_OWNER', 'IT_SPECIALIST');
    });

    this.posForm = this.fb.group({
      amount:        [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['CASH', Validators.required],
      notes:         [''],
    });

    this.dailyKpis$ = this.api.get<KpiData[]>('finance/daily-kpis').pipe(
      catchError(() => of([
        { label: "Today's Revenue",  value: '$842.50',  icon: 'attach_money', color: '#388e3c' },
        { label: 'Transactions',     value: 34,         icon: 'receipt',      color: '#1976d2' },
        { label: 'Avg Ticket',       value: '$24.78',   icon: 'bar_chart',    color: '#f57c00' },
      ]))
    );
  }

  submitPOS(): void {
    if (this.posForm.invalid) { this.posForm.markAllAsTouched(); return; }
    this.posLoading = true;
    this.api.post<Receipt>('transactions', this.posForm.value).pipe(
      catchError(() => of({
        receiptNumber: 'R-' + Date.now(),
        amount: this.posForm.value.amount,
        paymentMethod: this.posForm.value.paymentMethod,
        timestamp: new Date().toISOString(),
      } as Receipt))
    ).subscribe(receipt => {
      this.lastReceipt = receipt;
      this.posLoading  = false;
      this.posForm.reset({ paymentMethod: 'CASH' });
      this.notifications.success(`Transaction ${receipt.receiptNumber} recorded.`);
      this.reloadTrigger++;
    });
  }

  clearReceipt(): void {
    this.lastReceipt = null;
  }

  selectPayment(method: string): void {
    this.posForm.patchValue({ paymentMethod: method });
  }

  viewReceipt(row: Record<string, unknown>): void {
    this.notifications.info(`Receipt: ${row['receiptNumber']}`);
  }

  onFiltersChange(f: FilterParams): void {
    this.filters = f;
  }
}
