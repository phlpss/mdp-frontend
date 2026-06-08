import { Pipe, PipeTransform } from '@angular/core';
import { EnumValue } from '@core/models/meta.model';

@Pipe({ name: 'enumLabel' })
export class EnumLabelPipe implements PipeTransform {
  transform(value: string, enumValues: EnumValue[] | undefined): string {
    if (!enumValues || !value) return value ?? '—';
    const found = enumValues.find(e => e.value === value);
    return found?.label ?? value;
  }
}
