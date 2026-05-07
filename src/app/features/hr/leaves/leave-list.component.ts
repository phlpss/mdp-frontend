import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FilterParams } from '../../../core/models/api.model';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { hasRole, User } from '../../../core/models/user.model';
import { TableAction } from '../../../shared/components/entity-table/entity-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'mdp-leave-list',
  templateUrl: './leave-list.component.html',
  styleUrls: ['./leave-list.component.scss'],
})
export class LeaveListComponent implements OnInit {
  filters: FilterParams = {};
  isApprover = false;
  canRequest = true;
  currentUser: User | null = null;
  reloadTrigger = 0;

  tableActions: TableAction[] = [];

  constructor(
    private store: Store,
    private api: ApiService,
    private dialog: MatDialog,
    private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser).subscribe(user => {
      this.currentUser = user;
      this.isApprover  = hasRole(user, 'MANAGER', 'SUPERVISOR', 'HR', 'OWNER');

      if (this.isApprover) {
        this.filters = { status: 'PENDING' };
        this.tableActions = [
          {
            icon: 'check_circle',
            label: 'Approve',
            color: 'primary',
            hidden: (row) => (row as { status: string }).status !== 'PENDING',
            handler: (row) => this.approve(row as { id: string; status: string }),
          },
          {
            icon: 'cancel',
            label: 'Reject',
            color: 'warn',
            hidden: (row) => (row as { status: string }).status !== 'PENDING',
            handler: (row) => this.reject(row as { id: string; status: string }),
          },
        ];
      } else {
        // Employee view: show only their own
        if (user?.id) this.filters = { employeeId: user.id };
      }
    });
  }

  onFiltersChange(f: FilterParams): void {
    this.filters = { ...this.filters, ...f };
  }

  openRequestDialog(): void {
    // Opens DynamicFormComponent dialog for leave_request type
    import('../../../shared/components/dynamic-form/dynamic-form.component').then(() => {
      const MatDialog = this.dialog;
      // Use inline anonymous component for the dialog
      const ref = MatDialog.open(LeaveRequestDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
      });
      ref.afterClosed().subscribe(data => {
        if (data) {
          this.api.post('leave-requests', data).subscribe(() => {
            this.notifications.success('Leave request submitted.');
            this.reloadTrigger++;
          });
        }
      });
    });
  }

  approve(row: { id: string; status: string }): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Approve Leave', message: 'Approve this leave request?', confirmText: 'Approve', confirmColor: 'primary' },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.patch('leave-requests', row.id, { status: 'APPROVED' }).subscribe(() => {
          this.notifications.success('Leave approved.');
          this.reloadTrigger++;
        });
      }
    });
  }

  reject(row: { id: string; status: string }): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Reject Leave', message: 'Reject this leave request?', confirmText: 'Reject', confirmColor: 'warn' },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.patch('leave-requests', row.id, { status: 'REJECTED' }).subscribe(() => {
          this.notifications.success('Leave rejected.');
          this.reloadTrigger++;
        });
      }
    });
  }
}

// Inline dialog component for leave request form
import { Component as Comp, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Comp({
  selector: 'mdp-leave-request-dialog',
  template: `
    <h2 mat-dialog-title>Request Leave</h2>
    <mat-dialog-content>
      <mdp-dynamic-form
        typeName="leave_request"
        [formData]="null"
        submitLabel="Submit Request"
        (formSubmit)="onSubmit($event)"
        (formCancel)="ref.close(null)">
      </mdp-dynamic-form>
    </mat-dialog-content>
  `,
})
export class LeaveRequestDialogComponent {
  constructor(
    public ref: MatDialogRef<LeaveRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: unknown,
  ) {}
  onSubmit(v: Record<string, unknown>): void { this.ref.close(v); }
}
