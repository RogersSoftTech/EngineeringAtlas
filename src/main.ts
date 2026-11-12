import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAtlasPrimeNG } from './app/prime-theme';
import { primeUiLicense } from './primeui-license.local';

bootstrapApplication(AppComponent, { providers: [provideAtlasPrimeNG(primeUiLicense), provideRouter(routes, withHashLocation(), withInMemoryScrolling({ scrollPositionRestoration: 'top' }))] })
  .catch(error => console.error('Unable to start Engineering Atlas', error));
