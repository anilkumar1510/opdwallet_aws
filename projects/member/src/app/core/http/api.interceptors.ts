import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { toAppError } from './app-error';

/**
 * Resolves relative API paths against the configured base and sends the
 * session cookie. Absolute URLs pass through untouched.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (request, next) => {
  
  const isAbsolute = /^https?:\/\//i.test(request.url);
  const BASE_URL = environment.apiBaseUrl;
  let updatedUrl = request.url;
  const base = (BASE_URL ?? "").replace(/\/+$/, "");
  const apiOrigin = (() => {
    try {
      return new URL(base).origin;
    } catch {
      return "";
    }
  })();
  const isLocalProxyMode = (() => {
  const { hostname, port } = window.location;
  
  const isLocalHostName =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
    return isLocalHostName && String(port) === "4590";
  })();
  if (!isAbsolute) {
    if (!isLocalProxyMode) {
      const path = updatedUrl.replace(/^\/+/, "");
      updatedUrl = `${base}/${path}`;
    }
  }
  if (isLocalProxyMode && isAbsolute) {
    try {
      const reqUrl = new URL(updatedUrl);
      if (apiOrigin && reqUrl.origin === apiOrigin) {
        updatedUrl = `${reqUrl.pathname}${reqUrl.search}${reqUrl.hash}`;
        console.log(
          "Rewriting API absolute URL to relative (localhost:4590 proxy mode):",
          updatedUrl
        );
      }
    } catch {
      // ignore
    }
  }

  return next(
    request.clone({
      url: isAbsolute ? request.url : `${environment.apiBaseUrl}/${request.url.replace(/^\/+/, '')}`,
      withCredentials: true,
    }),
  );
};
export const apiRequestInterceptor: HttpInterceptorFn = (request, next) => {
    
    const token = localStorage.getItem('token');
    return next(request.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        // 'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    }))
}
  
/**
 * Ends the session exactly once when the API says it is no longer valid, no
 * matter which screen issued the request.
 *
 * SessionStore is resolved lazily: it depends on HttpClient, and this
 * interceptor is part of HttpClient's own pipeline, so injecting it eagerly
 * would be a dependency cycle.
 */
export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Deferred so the store is not constructed while HttpClient is still
        // being assembled.
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

/**
 * Order matters. sessionInterceptor must see the raw HttpErrorResponse, so it
 * sits inside errorInterceptor rather than after it.
 */
export const apiInterceptors = [apiUrlInterceptor, errorInterceptor, sessionInterceptor];
