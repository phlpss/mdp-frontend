import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Shared components
import { ShellComponent } from './components/shell/shell.component';
import { TopbarComponent } from './components/shell/topbar/topbar.component';
import { SidebarComponent } from './components/shell/sidebar/sidebar.component';
import { DynamicFormComponent } from './components/dynamic-form/dynamic-form.component';
import { EntityTableComponent } from './components/entity-table/entity-table.component';
import { MetaFilterBarComponent } from './components/meta-filter-bar/meta-filter-bar.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { ForbiddenComponent } from './components/forbidden/forbidden.component';

// Shared pipes
import { MaskPipe } from './pipes/mask.pipe';
import { MdpCurrencyPipe } from './pipes/currency-format.pipe';
import { RoleLabelPipe } from './pipes/role-label.pipe';
import { EnumLabelPipe } from './pipes/enum-label.pipe';

const MATERIAL_MODULES = [
  MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule,
  MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule,
  MatSelectModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule,
  MatTableModule, MatPaginatorModule, MatSortModule, MatProgressSpinnerModule,
  MatProgressBarModule, MatSnackBarModule, MatDialogModule, MatMenuModule,
  MatChipsModule, MatBadgeModule, MatTooltipModule, MatDividerModule,
  MatExpansionModule, MatTabsModule, MatGridListModule, MatRadioModule,
  MatButtonToggleModule,
];

const SHARED_COMPONENTS = [
  ShellComponent, TopbarComponent, SidebarComponent,
  DynamicFormComponent, EntityTableComponent, MetaFilterBarComponent,
  KpiCardComponent, ConfirmDialogComponent, ForbiddenComponent,
];

const SHARED_PIPES = [MaskPipe, MdpCurrencyPipe, RoleLabelPipe, EnumLabelPipe];

@NgModule({
  declarations: [...SHARED_COMPONENTS, ...SHARED_PIPES],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ...MATERIAL_MODULES,
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ...MATERIAL_MODULES,
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES,
  ],
})
export class SharedModule {}
