import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    // Existing providers from appConfig, if any
    ...(appConfig.providers || []),
    
    // Add the global MAT_FORM_FIELD_DEFAULT_OPTIONS provider
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
})
.catch((err) => console.error(err));