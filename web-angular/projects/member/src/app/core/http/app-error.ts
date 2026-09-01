import { HttpErrorResponse } from '@angular/common/http';

/**
 * One error shape for the whole app. Screens render error state from this,
 * never by inspecting status codes — that inconsistency is what the reference
 * portal ended up with.
 */
export type AppErrorKind = 'network' | 'server' | 'notFound' | 'validation' | 'unauthorized';

export interface AppError {
  readonly kind: AppErrorKind;
  readonly message: string;
  /** Safe to retry without the member changing anything. */
  readonly retryable: boolean;
  readonly status: number | null;
}

const MESSAGES: Readonly<Record<AppErrorKind, string>> = {
  network: 'We could not reach the service. Check your connection and try again.',
  server: 'Something went wrong at our end. Please try again.',
  notFound: 'We could not find what you were looking for.',
  validation: 'Please check the details you entered and try again.',
  unauthorized: 'Your session has ended. Please sign in again.',
};

const RETRYABLE: ReadonlySet<AppErrorKind> = new Set<AppErrorKind>(['network', 'server']);

export function appError(kind: AppErrorKind, message?: string, status: number | null = null): AppError {
  return { kind, message: message ?? MESSAGES[kind], retryable: RETRYABLE.has(kind), status };
}

/**
 * Prefers the API's own message when it is present and safe to show, so a
 * validation failure explains itself rather than falling back to boilerplate.
 */
function apiMessage(response: HttpErrorResponse): string | undefined {
  const body: unknown = response.error;
  if (typeof body === 'string' && body.trim() && !body.trim().startsWith('<')) return body.trim();
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
    if (Array.isArray(message) && message.length && typeof message[0] === 'string') {
      return message.join(', ');
    }
  }
  return undefined;
}

export function toAppError(response: HttpErrorResponse): AppError {
  // Status 0 means the request never reached the server: offline, DNS, CORS,
  // or a timeout. Not a server fault, and worth retrying.
  if (response.status === 0) return appError('network', undefined, 0);
  if (response.status === 401 || response.status === 403) {
    return appError('unauthorized', undefined, response.status);
  }
  if (response.status === 404) return appError('notFound', apiMessage(response), 404);
  if (response.status >= 400 && response.status < 500) {
    return appError('validation', apiMessage(response), response.status);
  }
  return appError('server', undefined, response.status);
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'retryable' in value &&
    'message' in value
  );
}
