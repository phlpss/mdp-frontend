import { Component, Input } from '@angular/core';
import { KpiData } from '@core/models/api.model';

@Component({
  selector: 'mdp-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
})
export class KpiCardComponent {
  @Input() data!: KpiData;

  get changeIcon(): string {
    if (!this.data.changeType) return '';
    return this.data.changeType === 'increase' ? 'arrow_upward'
         : this.data.changeType === 'decrease' ? 'arrow_downward'
         : 'remove';
  }

  get changeClass(): string {
    return this.data.changeType ?? 'neutral';
  }
}
