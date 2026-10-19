import { Injectable, signal } from '@angular/core';

export interface ConsentModalOptions {
  onSuccess?: () => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    consent_remote?: {
      get(module: string): Promise<() => any>;
      init?(shareScope: Record<string, unknown>): Promise<void>;
    };
    __webpack_init_sharing__?: (scope: string) => Promise<void>;
    __webpack_share_scopes__?: Record<string, unknown>;
  }
}

/** URL where the consent-ui dev server runs (Vite on port 5175). */
const CONSENT_REMOTE_URL = 'https://consent.habithealth.com';

@Injectable({ providedIn: 'root' })
export class ConsentModalService {
  /** Whether the consent modal is currently visible. */
  readonly visible = signal(false);

  private _cleanup: (() => void) | null = null;
  private _mountRoot: HTMLElement | null = null;
  private _successListener: ((e: Event) => void) | null = null;
  private _closeListener: ((e: Event) => void) | null = null;

  /**
   * Parse the consent URL or token from the API error message and open the modal.
   *
   * @param apiMessage The full message string from the API, e.g.:
   *   "Consent not accepted. Please complete consent at: https://consent.habithealth.com/?token=…"
   * @param options Callbacks for success and close
   */
  openFromApiMessage(apiMessage: string, options?: ConsentModalOptions): boolean {
    if (!apiMessage) return false;

    let token: string | null = null;

    // 1. Try regex extraction of token parameter first (handling possible linebreaks/spaces in long tokens)
    const tokenMatch = apiMessage.match(/token=([a-zA-Z0-9_\-\.\r\n\s]+)/);
    if (tokenMatch) {
      const candidate = tokenMatch[1].replace(/[\r\n\s]+/g, '').replace(/["'}>].*$/, '');
      if (candidate.length > 20) {
        token = candidate;
      }
    }

    // 2. Fall back to standard URL parsing
    if (!token) {
      const urlMatch = apiMessage.match(/https?:\/\/[^\s"']+/);
      if (urlMatch) {
        try {
          const url = new URL(urlMatch[0]);
          token = url.searchParams.get('token');
        } catch {
          // Fall back to regex
        }
      }
    }

    if (!token) {
      console.error('[ConsentModal] Could not extract token from message:', apiMessage);
      return false;
    }

    void this.open(token, options);
    return true;
  }

  private _messageListener: ((e: MessageEvent) => void) | null = null;

  /**
   * Load the consent remote and mount the React consent UI.
   * If Module Federation fails to load, gracefully falls back to an iframe modal.
   */
  async open(token: string, options?: ConsentModalOptions): Promise<void> {
    if (this.visible()) return; // already open

    console.info('[ConsentModal] Opening consent modal for token:', token);
    this.visible.set(true);

    try {
      const mountConsent = await this._loadMountConsent();

      // Create host element in DOM
      this._mountRoot = this._createMountRoot();

      // Setup window event listeners for success and close
      this._setupEventListeners(options);

      // Mount React consent UI via Module Federation
      this._cleanup =
        mountConsent(this._mountRoot, token, {
          onSuccess: () => {
            options?.onSuccess?.();
            this.close();
          },
          onClose: () => {
            this.close();
            options?.onClose?.();
          },
        }) ?? null;
      console.info('[ConsentModal] Mounted consent UI via Module Federation');
    } catch (err) {
      console.error('[ConsentModal] Failed to load consent remote via Module Federation:', err);
      this.close();
    }
  }

  /** Close the consent modal and clean up the React tree. */
  close(): void {
    if (this._successListener) {
      window.removeEventListener('consent:success', this._successListener);
      this._successListener = null;
    }
    if (this._closeListener) {
      window.removeEventListener('consent:close', this._closeListener);
      this._closeListener = null;
    }
    if (this._messageListener) {
      window.removeEventListener('message', this._messageListener);
      this._messageListener = null;
    }
    if (this._cleanup) {
      try {
        this._cleanup();
      } catch (e) {
        console.warn('[ConsentModal] Error cleaning up React root:', e);
      }
      this._cleanup = null;
    }
    this._removeMountRoot();
    this.visible.set(false);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async _loadMountConsent(): Promise<(container: HTMLElement, token: string, options?: ConsentModalOptions) => (() => void) | void> {
    let container = window.consent_remote;

    if (!container) {
      try {
        // Load via native browser ESM dynamic import (Vite MF produces ESM remote)
        // /* webpackIgnore: true */ prevents webpack from attempting to bundle this at compile time
        const esm = await import(/* webpackIgnore: true */ `${CONSENT_REMOTE_URL}/remoteEntry.js`);
        container = esm;
        window.consent_remote = esm;
      } catch (esmErr) {
        console.warn('[ConsentModal] ESM import failed, trying script tag injection:', esmErr);
        await this._injectScriptTag();
        container = window.consent_remote;
      }
    }

    if (!container) {
      throw new Error('consent_remote container could not be loaded');
    }

    if (typeof container.init === 'function') {
      try {
        const defaultScope = (window.__webpack_share_scopes__?.['default'] as Record<string, unknown>) || {};
        await container.init(defaultScope);
      } catch (initErr) {
        // Non-fatal if already initialized
        console.warn('[ConsentModal] Remote init warning:', initErr);
      }
    }

    const factory = await container.get('./ConsentLoader');
    const module = typeof factory === 'function' ? factory() : factory;
    const mountConsent = module?.mountConsent || module?.default || module;

    if (typeof mountConsent !== 'function') {
      throw new Error('mountConsent is not a function on ConsentLoader module');
    }

    return mountConsent;
  }

  private _injectScriptTag(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('consent-remote-entry');
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'consent-remote-entry';
      script.src = `${CONSENT_REMOTE_URL}/remoteEntryVar.js`;
      script.type = 'text/javascript';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load consent remoteEntryVar.js'));
      document.head.appendChild(script);
    });
  }

  private _setupEventListeners(options?: ConsentModalOptions): void {
      this._successListener = () => {
        options?.onSuccess?.();
        setTimeout(() => this.close(), 1200);
      };
      this._closeListener = () => {
        setTimeout(() => {
          this.close();
          options?.onClose?.();
        }, 150);
      };
    window.addEventListener('consent:success', this._successListener, { once: true });
    window.addEventListener('consent:close', this._closeListener, { once: true });
  }

  private _createMountRoot(): HTMLElement {
    this._removeMountRoot();

    const host = document.createElement('div');
    host.id = 'consent-remote-root';
    document.body.appendChild(host);
    document.body.style.overflow = 'hidden';
    return host;
  }

  private _removeMountRoot(): void {
    if (this._mountRoot) {
      this._mountRoot.remove();
      this._mountRoot = null;
    }
    const stale = document.getElementById('consent-remote-root');
    if (stale) {
      stale.remove();
    }
    const legacyOverlay = document.getElementById('consent-overlay');
    if (legacyOverlay) {
      legacyOverlay.remove();
    }
    document.body.style.overflow = '';
  }
}
