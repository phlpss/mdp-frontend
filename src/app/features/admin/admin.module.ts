import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from '@shared/shared.module';
import { RoleGuard } from '@core/guards/role.guard';
import { MetadataStudioComponent } from './metadata-studio/metadata-studio.component';
import { LocationListComponent } from './locations/location-list.component';
import { LocationFormDialogComponent } from './locations/location-form-dialog.component';

const routes: Routes = [
  { path: '',          redirectTo: 'metadata', pathMatch: 'full' },
  { path: 'metadata',  component: MetadataStudioComponent,
      canActivate: [RoleGuard], data: { roles: ['IT_SPECIALIST'] } },
  { path: 'locations', component: LocationListComponent,
    canActivate: [RoleGuard], data: { roles: ['BUSINESS_OWNER', 'IT_SPECIALIST', 'STORE_MANAGER'] } },
];

@NgModule({
  declarations: [
    MetadataStudioComponent,
    LocationListComponent,
    LocationFormDialogComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
  ],
})
export class AdminModule {}