import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mask' })
export class MaskPipe implements PipeTransform {
  transform(value: unknown, isSensitive: boolean, canView: boolean): string {
    if (isSensitive && !canView) return '••••••';
    return value !== null && value !== undefined ? String(value) : '—';
  }
}
