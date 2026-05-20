import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Chart, ChartConfiguration, ChartType,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, DoughnutController, LineController,
  Tooltip, Legend, Filler,
} from 'chart.js';

Chart.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    ArcElement, DoughnutController, LineController,
    Tooltip, Legend, Filler,
);
import { ApiService } from '@core/services/api.service';
import { KpiData, ChartData } from "@core/models/api.model";

@Component({
  selector: 'mdp-owner-dashboard',
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss'],
})
export class OwnerDashboardComponent implements OnInit {
  kpis$!: Observable<KpiData[]>;
  revenueChartData$!: Observable<ChartData>;
  expenseChartData$!: Observable<ChartData>;

  revenueChartConfig: ChartConfiguration = {
    type: 'line' as ChartType,
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } },
    },
  };

  expenseChartConfig: ChartConfiguration = {
    type: 'doughnut' as ChartType,
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      plugins: { legend: { position: 'right' } },
    },
  };

  selectedPeriod = 'month';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.kpis$ = this.api.get<KpiData[]>(`dashboard/owner/kpis?period=${this.selectedPeriod}`).pipe(
        catchError(() => of([
          { label: 'Monthly Revenue',  value: '$42,500', change: 12.3, changeType: 'increase' as const, icon: 'trending_up',  color: '#388e3c' },
          { label: 'Monthly Expenses', value: '$28,200', change: 4.1,  changeType: 'increase' as const, icon: 'trending_down', color: '#e53935' },
          { label: 'Net Profit',       value: '$14,300', change: 22.4, changeType: 'increase' as const, icon: 'savings',       color: '#1976d2' },
          { label: 'Profit Margin',    value: '33.6%',   change: 2.8,  changeType: 'increase' as const, icon: 'percent',       color: '#7b1fa2' },
          { label: 'Total Employees',  value: 18,        icon: 'people',   color: '#f57c00' },
          { label: 'Avg Daily Revenue',value: '$1,417',  icon: 'bar_chart', color: '#0288d1' },
        ]))
    );

    this.revenueChartData$ = this.api.get<ChartData>(`dashboard/owner/revenue-chart?period=${this.selectedPeriod}`).pipe(
        catchError(() => of({
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: [
            {
              label: 'Revenue',
              data: [38000,41000,45000,42000,39000,43000,47000,50000,44000,46000,48000,42500],
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25,118,210,0.1)',
              fill: true,
            },
            {
              label: 'Expenses',
              data: [24000,26000,28000,27000,25000,27000,29000,31000,28000,29000,30000,28200],
              borderColor: '#e53935',
              backgroundColor: 'rgba(229,57,53,0.1)',
              fill: true,
            },
          ],
        }))
    );

    this.expenseChartData$ = this.api.get<ChartData>(`dashboard/owner/expense-breakdown?period=${this.selectedPeriod}`).pipe(
        catchError(() => of({
          labels: ['Food Cost','Labor','Utilities','Supplies','Marketing','Other'],
          datasets: [{
            label: 'Expenses',
            data: [35, 40, 8, 6, 5, 6],
            backgroundColor: ['#1976d2','#388e3c','#f57c00','#7b1fa2','#0288d1','#78909c'],
          }],
        }))
    );
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadData();
  }
}