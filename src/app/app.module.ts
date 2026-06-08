import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

// App
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from '@core/core.module';
import { SharedModule } from '@shared/shared.module';

// Store
import { authReducer } from '@store/auth/auth.reducer';
import { metadataReducer } from '@store/metadata/metadata.reducer';
import { uiReducer } from '@store/ui/ui.reducer';
import { AuthEffects } from '@store/auth/auth.effects';
import { MetadataEffects } from '@store/metadata/metadata.effects';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,

    StoreModule.forRoot({
      auth:     authReducer,
      metadata: metadataReducer,
      ui:       uiReducer,
    }),
    EffectsModule.forRoot([AuthEffects, MetadataEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: !isDevMode(),
      connectInZone: true,
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
