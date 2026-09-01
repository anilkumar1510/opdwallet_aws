import { Injectable, signal } from '@angular/core';

/** Matches --breakpoint-md in styles.css and the reference portal's `md`. */
const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Layout is CSS-first; this exists only for the few decisions CSS cannot make
 * (an aria-current target, a focus trap). It stays reactive on resize rather
 * than sampling window width once at load.
 */
@Injectable({ providedIn: 'root' })
export class Breakpoint {
  private readonly _isDesktop = signal(this.query()?.matches ?? true);

  readonly isDesktop = this._isDesktop.asReadonly();

  constructor() {
    this.query()?.addEventListener('change', (event) => this._isDesktop.set(event.matches));
  }

  private query(): MediaQueryList | null {
    return typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia(DESKTOP_QUERY)
      : null;
  }
}
