import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { MetaAttribute, MetaType } from '@core/models/meta.model';

export const MetadataActions = createActionGroup({
  source: 'Metadata',
  events: {
    'Load Types':         emptyProps(),
    'Load Types Success': props<{ types: MetaType[] }>(),
    'Load Types Failure': props<{ error: string }>(),

    'Create Type':          props<{ metaType: Partial<MetaType> }>(),
    'Create Type Success':  props<{ metaType: MetaType }>(),
    'Create Type Failure':  props<{ error: string }>(),

    'Add Attribute':         props<{ typeName: string; attribute: Partial<MetaAttribute> }>(),
    'Add Attribute Success': props<{ typeName: string; attribute: MetaAttribute }>(),
    'Add Attribute Failure': props<{ error: string }>(),

    'Update Attribute':         props<{ typeName: string; attrName: string; attribute: Partial<MetaAttribute> }>(),
    'Update Attribute Success': props<{ typeName: string; attribute: MetaAttribute }>(),
    'Update Attribute Failure': props<{ error: string }>(),

    'Delete Attribute':         props<{ typeName: string; attrName: string }>(),
    'Delete Attribute Success': props<{ typeName: string; attrName: string }>(),
    'Delete Attribute Failure': props<{ error: string }>(),
  }
});
