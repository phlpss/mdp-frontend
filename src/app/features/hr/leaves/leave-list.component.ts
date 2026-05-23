import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {ApiService} from '@core/services/api.service';
import {NotificationService} from '@core/services/notification.service';
import {FilterParams} from '@core/models/api.model';
import {selectCurrentUser} from '@store/auth/auth.selectors';
import {hasRole, User} from '@core/models/user.model';
import {TableAction} from '@shared/components/entity-table/entity-table.component';
import {ConfirmDialogComponent} from '@shared/components/confirm-dialog/confirm-dialog.component';
import {LeaveRequestDialogComponent} from "@features/hr/leaves/leave-request-dialog.component";

@Component({
    selector: 'mdp-leave-list',
    templateUrl: './leave-list.component.html',
    styleUrls: ['./leave-list.component.scss'],
})
export class LeaveListComponent implements OnInit {
    filters: FilterParams = {};
    isApprover = false;
    currentUser: User | null = null;
    reloadTrigger = 0;
    tableActions: TableAction[] = [];
    cancellationActions: TableAction[] = [];
    apiPath = 'hr/leave';
    private isMy = false;

    constructor(
        private store: Store,
        private api: ApiService,
        private dialog: MatDialog,
        private notifications: NotificationService,
        private route: ActivatedRoute,
    ) {
    }

    ngOnInit(): void {
        this.isMy = this.route.snapshot.url.some(s => s.path === 'my');
        this.apiPath = this.isMy ? 'leaves/my' : 'hr/leave';

        this.store.select(selectCurrentUser).subscribe(user => {
            this.currentUser = user;
            const hasApproverRole = hasRole(user, 'STORE_MANAGER', 'SHIFT_SUPERVISOR', 'HR_MANAGER');
            this.isApprover = hasApproverRole && !this.isMy;

            if (this.isApprover) {
                this.filters = {status: 'PENDING'};
                this.tableActions = [
                    {
                        icon: 'check_circle', label: 'Approve', color: 'primary',
                        hidden: (row) => (row as any).payload?.leaveStatus !== 'PENDING',
                        handler: (row) => this.approve(row as { id: string }),
                    },
                    {
                        icon: 'cancel', label: 'Reject', color: 'warn',
                        hidden: (row) => (row as any).payload?.leaveStatus !== 'PENDING',
                        handler: (row) => this.reject(row as { id: string }),
                    },
                ];
                this.cancellationActions = [
                    {
                        icon: 'check_circle', label: 'Confirm Cancellation', color: 'warn',
                        handler: (row) => this.patchLeave((row as { id: string }).id, 'CANCELLED'),
                    },
                    {
                        icon: 'undo', label: 'Deny Cancellation', color: 'primary',
                        handler: (row) => this.patchLeave((row as { id: string }).id, 'APPROVED'),
                    },
                ];
            } else {
                if (!this.isMy && user?.id) this.filters = {employeeId: user.id};
                this.tableActions = [
                    {
                        icon: 'undo', label: 'Retract', color: 'warn',
                        hidden: (row) => (row as any).payload?.leaveStatus !== 'APPROVED',
                        handler: (row) => this.retract(row as { id: string }),
                    },
                ];
            }
        });
    }

    onFiltersChange(f: FilterParams): void {
        this.filters = {...this.filters, ...f};
    }

    openRequestDialog(): void {
        const ref = this.dialog.open(LeaveRequestDialogComponent, {width: '600px', maxWidth: '95vw'});
        ref.afterClosed().subscribe(data => {
            if (data) {
                if (data['startDate']) data['startDate'] = new Date(data['startDate'] as string).toISOString().substring(0, 10);
                if (data['endDate'])   data['endDate']   = new Date(data['endDate'] as string).toISOString().substring(0, 10);
                this.api.post('hr/leave', { ...data, employeeId: this.currentUser?.id }).subscribe(() => {
                    this.notifications.success('Leave request submitted.');
                    this.reloadTrigger++;
                });
            }
        });
    }

    approve(row: { id: string }): void {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Approve Leave',
                message: 'Approve this leave request?',
                confirmText: 'Approve',
                confirmColor: 'primary'
            },
        });
        ref.afterClosed().subscribe(confirmed => {
            if (confirmed) this.patchLeave(row.id, 'APPROVED');
        });
    }

    reject(row: { id: string }): void {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Reject Leave',
                message: 'Reject this leave request?',
                confirmText: 'Reject',
                confirmColor: 'warn'
            },
        });
        ref.afterClosed().subscribe(confirmed => {
            if (confirmed) this.patchLeave(row.id, 'REJECTED');
        });
    }

    retract(row: { id: string }): void {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Retract Leave',
                message: 'Retract this approved leave?',
                confirmText: 'Retract',
                confirmColor: 'warn'
            },
        });
        ref.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.api.post(`hr/leave/${row.id}/retract`, {}).subscribe(() => {
                    this.notifications.success('Leave retracted.');
                    this.reloadTrigger++;
                });
            }
        });
    }

    private patchLeave(id: string, status: string): void {
        this.api.patch('hr/leave', id + '/status', {leaveStatus: status}).subscribe(() => {
            this.notifications.success(`Leave ${status.toLowerCase()}.`);
            this.reloadTrigger++;
        });
    }
}

// ── Inline dialog ──────────────────────────────────────────────────────────────
