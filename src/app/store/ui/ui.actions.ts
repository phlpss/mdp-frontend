import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const UiActions = createActionGroup({
  source: 'UI',
  events: {
    'Set Loading':       props<{ loading: boolean }>(),
    'Set Error':         props<{ error: string | null }>(),
    'Clear Error':       emptyProps(),
    'Toggle Sidebar':    emptyProps(),
    'Set Sidebar Open':  props<{ open: boolean }>(),
    'Set Page Title':    props<{ title: string }>(),
  }
});
