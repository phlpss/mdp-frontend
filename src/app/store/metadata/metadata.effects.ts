import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MetadataActions } from './metadata.actions';
import { MetadataService } from '../../core/services/metadata.service';
import { NotificationService } from '../../core/services/notification.service';

@Injectable()
export class MetadataEffects {
  loadTypes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MetadataActions.loadTypes),
      switchMap(() =>
        this.metaService.getAllTypes().pipe(
          map(types => MetadataActions.loadTypesSuccess({ types })),
          catchError(err => of(MetadataActions.loadTypesFailure({ error: err?.message ?? 'Failed to load metadata' })))
        )
      )
    )
  );

  createType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MetadataActions.createType),
      switchMap(({ type }) =>
        this.metaService.createType(type).pipe(
          map(created => {
            this.notifications.success(`Type '${created.label}' created.`);
            return MetadataActions.createTypeSuccess({ type: created });
          }),
          catchError(err => of(MetadataActions.createTypeFailure({ error: err?.message })))
        )
      )
    )
  );

  addAttribute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MetadataActions.addAttribute),
      switchMap(({ typeName, attribute }) =>
        this.metaService.addAttribute(typeName, attribute).pipe(
          map(attr => {
            this.notifications.success(`Attribute '${attr.label}' added.`);
            return MetadataActions.addAttributeSuccess({ typeName, attribute: attr });
          }),
          catchError(err => of(MetadataActions.addAttributeFailure({ error: err?.message })))
        )
      )
    )
  );

  updateAttribute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MetadataActions.updateAttribute),
      switchMap(({ typeName, attrName, attribute }) =>
        this.metaService.updateAttribute(typeName, attrName, attribute).pipe(
          map(attr => {
            this.notifications.success(`Attribute '${attr.label}' updated.`);
            return MetadataActions.updateAttributeSuccess({ typeName, attribute: attr });
          }),
          catchError(err => of(MetadataActions.updateAttributeFailure({ error: err?.message })))
        )
      )
    )
  );

  deleteAttribute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MetadataActions.deleteAttribute),
      switchMap(({ typeName, attrName }) =>
        this.metaService.deleteAttribute(typeName, attrName).pipe(
          map(() => {
            this.notifications.success(`Attribute deleted.`);
            return MetadataActions.deleteAttributeSuccess({ typeName, attrName });
          }),
          catchError(err => of(MetadataActions.deleteAttributeFailure({ error: err?.message })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private metaService: MetadataService,
    private notifications: NotificationService,
  ) {}
}
