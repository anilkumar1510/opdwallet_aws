import { Pipe, PipeTransform } from '@angular/core';

/**
 * This app's static assets (public/images/...) are only guaranteed to be
 * reachable at its own origin. Standalone, that's always the current page's
 * origin, so a bare relative path like 'images/icons/foo.svg' just works.
 *
 * But this app is also consumed as a Module Federation remote by the
 * kx-patient-portal host (mounted under /habit-opd/member): there, the
 * current page's origin is the HOST's, not this app's, so the same relative
 * path 404s. This pipe prefixes it with this app's own origin instead,
 * leaving already-absolute URLs (http(s):, //, data:, blob:) untouched so
 * it's also safe for anything not shaped like a bundled static asset.
 *
 * The origin is read from `__webpack_public_path__` at call time — webpack's
 * own runtime record of where this bundle was actually loaded from (the
 * `OPD_WALLET_PUBLIC_PATH` override in dev, or the auto-detected origin in a
 * standalone deployment) — instead of a hardcoded domain, so this keeps
 * working no matter where the app is served from. If it can't be resolved
 * to an absolute origin, a root-relative path is used as a fallback so
 * assets still resolve against the current origin rather than against
 * whatever nested route the SPA happens to be on.
 */
@Pipe({ name: 'remoteAsset' })
export class RemoteAssetPipe implements PipeTransform {
  transform(path: string | null | undefined): string {
    if (!path) return '';
    if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    const relative = path.replace(/^\/+/, '');
    const origin = this.resolveOrigin();
    return origin ? `${origin}/${relative}` : `/${relative}`;
  }

  private resolveOrigin(): string {
    const publicPath = typeof __webpack_public_path__ === 'string' ? __webpack_public_path__ : '';
    return /^https?:\/\//i.test(publicPath) ? publicPath.replace(/\/+$/, '') : '';
  }
}
