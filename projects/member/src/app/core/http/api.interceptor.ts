import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Injector, inject, PLATFORM_ID } from '@angular/core';
import { catchError, map, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { toAppError } from './app-error';
import { SessionStore, bodySaysSessionEnded } from '../session/session.store';
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
 * Ends the session once when any API reports it is no longer valid: HTTP
 * 401/403, or a 200 whose body says the session has ended. The session check
 * itself (application_master) is left to SessionStore, which reports its own
 * failure.
 *
 * SessionStore is fetched from the injector only when needed: it depends on
 * HttpClient, so injecting it up front would be circular.
 */
export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
  if (request.url.includes('application_master')) return next(request);

  const end = (reason: 'expired' | 'invalid', message = '') => injector.get(SessionStore).terminate(reason, message);

  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        const message = bodySaysSessionEnded(event.body);
        if (message) end(/expire|timed? ?out/i.test(message) ? 'expired' : 'invalid', message);
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) end('expired');
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
/**
 * True on the dev server (localhost:4500), where API paths stay relative so
 * proxy.conf.json forwards them. Everywhere else they go to environment.apiBaseUrl.
 */
export function isLocalProxyMode(): boolean {
  if (typeof window === 'undefined') return false;
  const { hostname, port } = window.location;
  const isLocalHostName = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  return isLocalHostName && String(port) === '4500';
}

/**
 * The address of an API path the browser must reach on its own — a form post
 * or a third party's redirect, which no interceptor sees. Same rule as
 * apiInterceptor: relative through the dev proxy, environment.apiBaseUrl elsewhere.
 */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = '/' + path.replace(/^\/+/, '');
  return isLocalProxyMode()
    ? window.location.origin + clean
    : (environment.apiBaseUrl ?? '').replace(/\/+$/, '') + clean;
}

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
  // http://localhost:4500
  //
  // Any other host/port uses environment.apiBaseUrl.
  const localProxy = isBrowser && isLocalProxyMode();

  // 1) Relative URLs
  //
  // localhost:4500:
  //   Keep relative → dev/SSR proxy handles it.
  //
  // Other environments:
  //   Prefix with environment.apiBaseUrl.
  if (!isAbsoluteUrl && !isAsset) {
    if (!localProxy) {
      const path = updatedUrl.replace(/^\/+/, '');

      updatedUrl = `${base}/${path}`;

      if (isBrowser) {
        // console.log(
        //   'Applying BASE_URL (relative, non-proxy-mode):',
        //   updatedUrl
        // );
      }
    } else {
      if (isBrowser) {
        // console.log(
        //   'Keeping relative URL (localhost:4500 proxy mode):',
        //   updatedUrl
        // );
      }
    }
  }

  // 2) Absolute API URLs on localhost:4500
  //
  // Rewrite them to relative URLs so they go through
  // the local proxy.
  if (localProxy && isAbsoluteUrl && !isAsset) {
    try {
      const reqUrl = new URL(updatedUrl);

      if (apiOrigin && reqUrl.origin === apiOrigin) {
        updatedUrl =
          `${reqUrl.pathname}${reqUrl.search}${reqUrl.hash}`;

        // console.log(
        //   'Rewriting API absolute URL to relative (localhost:4500 proxy mode):',
        //   updatedUrl
        // );
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

export const apiResponseInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    map(event => {
      if (
          event instanceof HttpResponse &&
          event.status === 200 &&
          event.body
        ) {
          return event.clone({
            body: event.body
          });
        }
      return event;
    })
  );
}
/**
 * Order matters. sessionInterceptor must see the raw HttpErrorResponse before
 * errorInterceptor wraps it.
 */
export const apiInterceptors = [apiInterceptor, apiResponseInterceptor, errorInterceptor, sessionInterceptor];
