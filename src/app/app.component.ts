import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from './store/auth/auth.actions';
import { MetadataActions } from './store/metadata/metadata.actions';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'mdp-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  constructor(private store: Store, private authService: AuthService) {}

  ngOnInit(): void {
    // Restore session on app start
    if (this.authService.isAuthenticated()) {
      this.store.dispatch(AuthActions.loadCurrentUser());
      this.store.dispatch(MetadataActions.loadTypes());
    }
  }
}
