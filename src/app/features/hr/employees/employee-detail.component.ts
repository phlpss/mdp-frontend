import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { selectCurrentUser, selectCanViewSensitive } from '@store/auth/auth.selectors';
import { selectFormAttributesForType } from '@store/metadata/metadata.selectors';
import { MetaAttribute } from '@core/models/meta.model';
import { hasRole } from '@core/models/user.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { EmployeeFormDialogComponent } from './employee-form-dialog.component';

@Component({
    selector: 'mdp-employee-detail',
    templateUrl: './employee-detail.component.html',
    styleUrls: ['./employee-detail.component.scss'],
})
export class EmployeeDetailComponent implements OnInit {
    employee: Record<string, unknown> | null = null;
    loading = true;
    canEdit = false;
    canDeactivate = false;
    employeeId!: string;

    fieldGroups: { groupName: string; attributes: MetaAttribute[] }[] = [];
    referenceNames: Record<string, Record<string, string>> = {};
    revealed: Record<string, boolean> = {};
    canViewSensitive = false;

    private readonly HIDDEN_FIELDS = new Set(['isActive', 'fullName', 'role']);
    private readonly SENSITIVE_FIELDS = new Set(['monthlySalary', 'hourlyRate', 'salary']);

    constructor(
        private route: ActivatedRoute,
        private api: ApiService,
        private dialog: MatDialog,
        private store: Store,
        private notifications: NotificationService,
    ) {}

    ngOnInit(): void {
        this.employeeId = this.route.snapshot.paramMap.get('id') ?? '';

        this.store.select(selectCurrentUser).subscribe(user => {
            this.canEdit       = hasRole(user, 'STORE_MANAGER', 'HR_MANAGER', 'BUSINESS_OWNER', 'IT_SPECIALIST');
            this.canDeactivate = hasRole(user, 'STORE_MANAGER', 'HR_MANAGER', 'BUSINESS_OWNER', 'IT_SPECIALIST');
        });

        this.store.select(selectCanViewSensitive).subscribe(v => this.canViewSensitive = !!v);

        this.store.select(selectFormAttributesForType('Employee')).subscribe(attrs => {
            const visible = attrs.filter(a => !this.HIDDEN_FIELDS.has(a.name));
            const map = new Map<string, MetaAttribute[]>();
            visible.forEach(a => {
                const key = a.group ?? '';
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(a);
            });
            this.fieldGroups = Array.from(map.entries()).map(([groupName, attributes]) => ({ groupName, attributes }));
            this.loadReferenceOptions(visible);
        });

        this.loadEmployee();
    }

    loadEmployee(): void {
        this.loading = true;
        this.api.getById<{ id: string; payload: Record<string, unknown> }>('entities/Employee', this.employeeId)
            .pipe(catchError(() => of(null)))
            .subscribe(emp => {
                if (!emp) { this.loading = false; return; }
                this.employee = { id: emp.id, ...emp.payload };
                this.loading = false;
            });
    }

    private loadReferenceOptions(attrs: MetaAttribute[]): void {
        attrs.filter(a => a.fieldType === 'reference' && a.referenceType).forEach(attr => {
            this.api.getPage<any>(`entities/${attr.referenceType}`, { page: 0, size: 200 }, {}).pipe(
                catchError(() => of({ content: [] } as any))
            ).subscribe((page: any) => {
                const m: Record<string, string> = {};
                (page.content ?? []).forEach((item: any) => {
                    m[item.id] = item.payload?.storeName ?? item.payload?.fullName ?? item.payload?.name ?? item.id;
                });
                this.referenceNames[attr.name] = m;
            });
        });
    }

    isSensitive(attr: MetaAttribute): boolean {
        return attr.sensitive || this.SENSITIVE_FIELDS.has(attr.name);
    }

    toggleReveal(attr: MetaAttribute): void {
        if (!this.canViewSensitive) return;
        this.revealed[attr.name] = !this.revealed[attr.name];
    }

    displayValue(attr: MetaAttribute): string {
        const raw = this.employee ? this.employee[attr.name] : null;
        if (raw === null || raw === undefined || raw === '') return '—';
        if (this.isSensitive(attr) && (!this.canViewSensitive || !this.revealed[attr.name])) return '••••••';
        return this.formatValue(attr, raw);
    }

    group(name: string): { groupName: string; attributes: MetaAttribute[] } | undefined {
        return this.fieldGroups.find(g => g.groupName === name);
    }

    private formatValue(attr: MetaAttribute, raw: unknown): string {
        switch (attr.fieldType) {
            case 'reference': return this.referenceNames[attr.name]?.[String(raw)] ?? String(raw);
            case 'enum':      return attr.enumValues?.find(e => e.value === String(raw))?.label ?? String(raw);
            case 'boolean':   return raw ? 'Yes' : 'No';
            case 'date':      return new Date(String(raw)).toLocaleDateString();
            case 'datetime':  return new Date(String(raw)).toLocaleString();
            case 'currency':  return this.money(raw);
        }
        if (this.SENSITIVE_FIELDS.has(attr.name) && !isNaN(Number(raw))) return this.money(raw);
        return String(raw);
    }

    private money(raw: unknown): string {
        return '$' + Number(raw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    get fullName(): string {
        return this.employee ? (this.employee['fullName'] as string ?? '') : '';
    }

    get initials(): string {
        const parts = this.fullName.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
    }

    openEditDialog(): void {
        const ref = this.dialog.open(EmployeeFormDialogComponent, {
            width: '720px', maxWidth: '95vw', data: { formData: this.employee },
        });
        ref.afterClosed().subscribe(data => {
            if (data) {
                this.api.put('entities/Employee', this.employeeId, data).subscribe(() => {
                    this.notifications.success('Employee updated.');
                    this.loadEmployee();
                });
            }
        });
    }

    deactivate(): void {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Deactivate Employee',
                message: `Are you sure you want to deactivate ${this.employee?.['fullName']}?`,
                confirmText: 'Deactivate', confirmColor: 'warn',
            },
        });
        ref.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.api.patch('entities/Employee', this.employeeId, { isActive: false }).subscribe(() => {
                    this.notifications.success('Employee deactivated.');
                    this.loadEmployee();
                });
            }
        });
    }
}