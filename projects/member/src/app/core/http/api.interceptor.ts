import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject, PLATFORM_ID } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { toAppError } from './app-error';
import { isPlatformBrowser } from '@angular/common';
/**
 * Resolves relative API paths against the configured base and ensures session
 * cookies are sent for same-origin requests.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const isAbsolute = /^https?:\/\//i.test(request.url);
  return next(
    request.clone({
      url: isAbsolute ? request.url : `${environment.apiBaseUrl}/${request.url.replace(/^\/+/, '')}`,
      withCredentials: true,
    }),
  );
};

/**
 * Ends the session once when the API reports it is no longer valid.
 */
export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        void Promise.resolve().then(async () => {
          const { SessionStore } = await import('../session/session.store');
          injector.get(SessionStore).terminate();
        });
      }
      return throwError(() => error);
    }),
  );
};

/** Converts transport errors into the app's single error shape. */
export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) =>
      throwError(() => (error instanceof HttpErrorResponse ? toAppError(error) : error)),
    ),
  );
const allowedUrls = [
  'https://maps.googleapis.com',
  'https://onemg.gumlet.io',
];

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  const BASE_URL = environment.apiBaseUrl;

  // SSR-safe: do not access browser globals on the server.
  const isBrowser = isPlatformBrowser(platformId);

  let updatedUrl = req.url;

  const base = (BASE_URL ?? '').replace(/\/+$/, '');

  const apiOrigin = (() => {
    try {
      return new URL(base).origin;
    } catch {
      return '';
    }
  })();

  const isAbsoluteUrl = /^https?:\/\//i.test(updatedUrl);

  const isAsset =
    updatedUrl.startsWith('assets/') ||
    updatedUrl.startsWith('/assets/');

  // Proxy mode must ONLY be enabled for:
  // http://localhost:4590
  //
  // Any other host/port uses environment.apiBaseUrl.
  const isLocalProxyMode = (() => {
    if (!isBrowser) {
      return false;
    }

    const { hostname, port } = window.location;

    const isLocalHostName =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0';

    return isLocalHostName && String(port) === '4590';
  })();

  // 1) Relative URLs
  //
  // localhost:4590:
  //   Keep relative → dev/SSR proxy handles it.
  //
  // Other environments:
  //   Prefix with environment.apiBaseUrl.
  if (!isAbsoluteUrl && !isAsset) {
    if (!isLocalProxyMode) {
      const path = updatedUrl.replace(/^\/+/, '');

      updatedUrl = `${base}/${path}`;

      if (isBrowser) {
        console.log(
          'Applying BASE_URL (relative, non-proxy-mode):',
          updatedUrl
        );
      }
    } else {
      if (isBrowser) {
        console.log(
          'Keeping relative URL (localhost:4590 proxy mode):',
          updatedUrl
        );
      }
    }
  }

  // 2) Absolute API URLs on localhost:4590
  //
  // Rewrite them to relative URLs so they go through
  // the local proxy.
  if (isLocalProxyMode && isAbsoluteUrl && !isAsset) {
    try {
      const reqUrl = new URL(updatedUrl);

      if (apiOrigin && reqUrl.origin === apiOrigin) {
        updatedUrl =
          `${reqUrl.pathname}${reqUrl.search}${reqUrl.hash}`;

        console.log(
          'Rewriting API absolute URL to relative (localhost:4590 proxy mode):',
          updatedUrl
        );
      }
    } catch {
      // Ignore invalid URLs.
    }
  }

  // 3) Set credentials
  //
  // External allowed URLs → withCredentials: false
  // Everything else → withCredentials: true
  const modifiedReq = allowedUrls.some((url) =>
    updatedUrl.startsWith(url)
  )
    ? req.clone({
        url: updatedUrl,
        withCredentials: false,
      })
    : req.clone({
        url: updatedUrl,
        withCredentials: true,
      });

  return next(modifiedReq);
};
/**
 * Order matters. sessionInterceptor must see the raw HttpErrorResponse before
 * errorInterceptor wraps it.
 */
export const apiInterceptors = [apiInterceptor, errorInterceptor, sessionInterceptor];
