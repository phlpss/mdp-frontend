import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { KpiData } from '../../../core/models/api.model';

@Component({
  selector: 'mdp-forecast',
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
})
export class ForecastComponent implements OnInit {
  kpis: KpiData[] = [];
  loading = false;
  periodControl = new FormControl('month');

  revenueChartConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan+','Feb+','Mar+'],
      datasets: [
        {
          label: 'Actual Revenue',
          data: [38000,41000,45000,42000,39000,43000,47000,50000,44000,46000,48000,42500, null as unknown as number, null as unknown as number, null as unknown as number],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25,118,210,0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Forecasted Revenue',
          data: [null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, 42500, 44000, 46000, 48000],
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76,175,80,0.1)',
          borderDash: [5, 5],
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { callback: (v) => '$' + Number(v).toLocaleString() },
        },
      },
    },
  };

  expenseChartConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Supplies','Labor','Utilities','Marketing','Food Cost','Other'],
      datasets: [{
        label: 'Monthly Average',
        data: [4200, 12000, 2400, 1800, 6500, 1300],
        backgroundColor: ['#1976d2','#388e3c','#f57c00','#7b1fa2','#e53935','#78909c'],
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => '$' + Number(v).toLocaleString() } },
      },
    },
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadForecast();
  }

  loadForecast(): void {
    this.loading = true;
    this.api.get<KpiData[]>('finance/forecast/kpis').pipe(
      catchError(() => of([
        { label: 'Projected Revenue (Next Mo.)', value: '$46,000', change: 8.2,  changeType: 'increase', icon: 'trending_up',  color: '#388e3c' },
        { label: 'Cost Ratio',                   value: '61.4%',   change: -1.2, changeType: 'decrease', icon: 'percent',      color: '#f57c00' },
        { label: 'Projected Net Profit',         value: '$17,764', change: 12.6, changeType: 'increase', icon: 'savings',      color: '#1976d2' },
        { label: 'Profit Margin Trend',          value: '38.6%',   change: 1.2,  changeType: 'increase', icon: 'bar_chart',    color: '#7b1fa2' },
      ]))
    ).subscribe(kpis => {
      this.kpis    = kpis;
      this.loading = false;
    });
  }

  exportCsv(): void {
    const header = 'Month,Actual Revenue,Forecasted Revenue\n';
    const rows   = this.revenueChartConfig.data.labels!.map((label, i) => {
      const actual = (this.revenueChartConfig.data.datasets[0].data as number[])[i] ?? '';
      const fcast  = (this.revenueChartConfig.data.datasets[1].data as number[])[i] ?? '';
      return `${label},${actual},${fcast}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'revenue-forecast.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
