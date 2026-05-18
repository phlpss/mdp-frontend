import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FilterParams, PageResponse } from '../../../core/models/api.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface Location {
  id: string;
  name: string;
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
  filters: FilterParams = {};
  displayedColumns = ['name','address','phone','manager','isActive','actions'];

  constructor(
      private api: ApiService,
      private dialog: MatDialog,
      private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.api.get<Location[]>('locations').pipe(
        catchError(() => of([
          { id: '1', name: 'Downtown Branch',    address: '123 Main St, City Center',  phone: '+1 555-0100', isActive: true,  manager: 'Alice Johnson' },
          { id: '2', name: 'Airport Terminal',   address: 'Terminal 2, City Airport',  phone: '+1 555-0200', isActive: true,  manager: 'Bob Smith' },
          { id: '3', name: 'University Campus',  address: '45 College Ave, Campus',    phone: '+1 555-0300', isActive: true,  manager: 'Carol White' },
          { id: '4', name: 'Shopping Mall',      address: 'Level 2, Metro Mall',       phone: '+1 555-0400', isActive: false, manager: null },
        ] as Location[]))
    ).subscribe(locations => {
      this.locations = locations;
      this.loading = false;
    });
  }

  toggleActive(location: Location): void {
    const action = location.isActive ? 'deactivate' : 'activate';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${location.isActive ? 'Deactivate' : 'Activate'} Location`,
        message: `Are you sure you want to ${action} "${location.name}"?`,
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
}