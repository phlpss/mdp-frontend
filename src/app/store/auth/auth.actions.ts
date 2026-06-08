import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginRequest, LoginResponse, User } from '@core/models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login':          props<{ request: LoginRequest }>(),
    'Login Success':  props<{ response: LoginResponse }>(),
    'Login Failure':  props<{ error: string }>(),

    'Logout':         emptyProps(),
    'Logout Success': emptyProps(),

    'Load Current User':         emptyProps(),
    'Load Current User Success': props<{ user: User }>(),
    'Load Current User Failure': props<{ error: string }>(),

    'Set Active Location': props<{ locationId: string }>(),
  }
});
