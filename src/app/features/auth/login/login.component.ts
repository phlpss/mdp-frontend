import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AuthActions } from '@store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '@store/auth/auth.selectors';

@Component({
  selector: 'mdp-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  hidePassword = true;

  constructor(private fb: FormBuilder, private store: Store) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
    this.loading$ = this.store.select(selectAuthLoading);
    this.error$   = this.store.select(selectAuthError);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.store.dispatch(AuthActions.login({ request: this.form.value }));
  }
}
