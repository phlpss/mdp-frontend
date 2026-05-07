import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectSidebarOpen, selectLoading } from '../../../store/ui/ui.selectors';
import { UiActions } from '../../../store/ui/ui.actions';
import { AuthActions } from '../../../store/auth/auth.actions';

@Component({
  selector: 'mdp-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  sidebarOpen$!: Observable<boolean>;
  loading$!: Observable<boolean>;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.sidebarOpen$ = this.store.select(selectSidebarOpen);
    this.loading$     = this.store.select(selectLoading);
  }

  onToggleSidebar(): void {
    this.store.dispatch(UiActions.toggleSidebar());
  }

  onLogout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
