import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { selectCurrentUser, selectActiveLocationId } from '@store/auth/auth.selectors';
import { AuthActions } from '@store/auth/auth.actions';
import { User } from '@core/models/user.model';
import { ApiService } from '@core/services/api.service';

interface Location {
  id: string;
  name: string;
}

@Component({
  selector: 'mdp-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  @Input() sidebarOpen = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logoutClick   = new EventEmitter<void>();

  currentUser$: Observable<User | null>;
  activeLocationId$: Observable<string | null>;
  locations$: Observable<Location[]>;

  constructor(private store: Store, private api: ApiService) {
    this.currentUser$      = this.store.select(selectCurrentUser);
    this.activeLocationId$ = this.store.select(selectActiveLocationId);
    this.locations$ = of([]);
  }

  ngOnInit(): void {
    this.locations$ = this.api.get<Location[]>('entities/StoreLocation').pipe(
      catchError(() => of([{ id: '1', name: 'Downtown Branch' }]))
    );
  }

  onLocationChange(locationId: string): void {
    this.store.dispatch(AuthActions.setActiveLocation({ locationId }));
  }

  getInitials(user: User): string {
    return (user.fullName ?? '').split(' ').map((p: string) => p[0] ?? '').slice(0,2).join('').toUpperCase();
  }
}