import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { apiInterceptors } from './core/http/api.interceptors';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // No zone.js: every piece of state in this app is a signal, so there is
    // nothing for zone patching to catch.
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors(apiInterceptors)),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Land at the top on navigation, but restore position on back/forward.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
  ],
};
