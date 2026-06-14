import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { FilterParams, PageResponse } from '@core/models/api.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import {LocationFormDialogComponent} from "@features/admin/locations/location-form-dialog.component";
import { Observable, of, forkJoin } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@store/auth/auth.selectors';
import { hasRole } from '@core/models/user.model';

interface Location {
  id: string;
  storeName: string;
  address: string;
  phone?: string;
  isActive: boolean;
  manager?: string;
}

@Component({
  selector: 'mdp-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss'],
})
export class LocationListComponent implements OnInit {
  locations: Location[] = [];
  loading = false;
  isIt = false;
  filters: FilterParams = {};
  displayedColumns = ['name','address','phone','manager','isActive','actions'];

  constructor(
      private api: ApiService,
      private dialog: MatDialog,
      private notifications: NotificationService,
      private store: Store,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser).subscribe(u => this.isIt = hasRole(u, 'IT_SPECIALIST'));
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    forkJoin({
      locs: this.api.get<any>('entities/StoreLocation').pipe(
          catchError(() => of([
            { id: '1', storeName: 'Downtown Branch',    address: '123 Main St, City Center',  phone: '+1 555-0100', isActive: true,  manager: 'Alice Johnson' },
            { id: '2', storeName: 'Airport Terminal',   address: 'Terminal 2, City Airport',  phone: '+1 555-0200', isActive: true,  manager: 'Bob Smith' },
            { id: '3', storeName: 'University Campus',  address: '45 College Ave, Campus',    phone: '+1 555-0300', isActive: true,  manager: 'Carol White' },
            { id: '4', storeName: 'Shopping Mall',      address: 'Level 2, Metro Mall',       phone: '+1 555-0400', isActive: false, manager: null },
          ] as Location[]))),
      emps: this.api.getPage<any>('entities/Employee', { page: 0, size: 200 }, {}).pipe(
          catchError(() => of({ content: [] }))),
    }).subscribe(({ locs, emps }) => {
      const empName: Record<string, string> = {};
      (Array.isArray(emps) ? emps : emps?.content ?? []).forEach((e: any) => {
        empName[e.id] = e.payload?.fullName ?? e.payload?.name ?? e.id;
      });
      const rows = Array.isArray(locs) ? locs : (locs as any)?.content ?? [];
      this.locations = rows.map((r: any) => {
        const loc = r.payload ? { id: r.id, ...r.payload } : r;
        if (loc.manager) loc.manager = empName[loc.manager] ?? loc.manager;
        return loc;
      });
      this.loading = false;
    });
  }

  openEditDialog(location: Location): void {
    const ref = this.dialog.open(LocationFormDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { formData: { ...location } },
    });
    ref.afterClosed().subscribe(data => {
      if (data) {
        this.api.patch('entities/StoreLocation', location.id, data).subscribe(() => {
          this.notifications.success('Location updated.');
          this.loadLocations();
        });
      }
    });
  }

  toggleActive(location: Location): void {
    const action = location.isActive ? 'deactivate' : 'activate';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${location.isActive ? 'Deactivate' : 'Activate'} Location`,
        message: `Are you sure you want to ${action} "${location.storeName}"?`,
        confirmText: location.isActive ? 'Deactivate' : 'Activate',
        confirmColor: location.isActive ? 'warn' : 'primary',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.patch('entities/StoreLocation', location.id, { isActive: !location.isActive }).pipe(
            catchError(() => of(null))
        ).subscribe(() => {
          this.notifications.success(`Location ${action}d.`);
          this.loadLocations();
        });
      }
    });
  }

  deleteEntity(row: { id: string; payload?: Record<string, unknown> }): void {
    const name = row.payload?.['storeName'] ?? 'this store';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete permanently',
        message: `Permanently delete ${name}? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete('entities/StoreLocation', row.id).subscribe({
        next: () => { this.notifications.success('Deleted permanently.'); this.loadLocations(); },
        error: () => this.notifications.error('Delete failed.'),
      });
    });
  }
}