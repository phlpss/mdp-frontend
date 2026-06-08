import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MetadataActions } from './metadata.actions';
import { MetadataService } from '@core/services/metadata.service';
import { NotificationService } from '@core/services/notification.service';

const FIELD_TYPE_TO_DATA_TYPE: Record<string, string> = {
  string: 'STRING', number: 'INTEGER', currency: 'DECIMAL',
  boolean: 'BOOLEAN', date: 'DATE', datetime: 'DATETIME', enum: 'ENUM',
  email: 'STRING', phone: 'STRING', text: 'STRING', file: 'STRING', reference: 'STRING',
};

function toBackendAttr(attr: any): any {
  return {
    ...attr,
    dataType: FIELD_TYPE_TO_DATA_TYPE[attr.fieldType ?? 'string'] ?? 'STRING',
    mandatory: attr.required ?? false,
  };
}

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
      switchMap(({ metaType: payload }) =>
        this.metaService.createType(payload).pipe(
          map(created => {
            // Backend returns {name, attributes, sensitiveFields}; merge to preserve label/icon from the form.
            const merged = { ...payload, ...created, label: payload.label ?? created.name } as any;
            this.notifications.success(`Type '${merged.label}' created.`);
            return MetadataActions.createTypeSuccess({ metaType: merged });
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
        // Map frontend field names (fieldType, required) to backend names (dataType, mandatory).
        // Backend returns the full MetaType, not just the attribute, so reload all types after success.
        this.metaService.addAttribute(typeName, toBackendAttr(attribute)).pipe(
          map(() => {
            this.notifications.success(`Attribute '${(attribute as any).label ?? (attribute as any).name}' added.`);
            return MetadataActions.loadTypes();
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
        // Same field-name mapping as addAttribute. Reload after success for correct state.
        this.metaService.updateAttribute(typeName, attrName, toBackendAttr(attribute)).pipe(
          map(() => {
            this.notifications.success(`Attribute '${(attribute as any).label ?? attrName}' updated.`);
            return MetadataActions.loadTypes();
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
