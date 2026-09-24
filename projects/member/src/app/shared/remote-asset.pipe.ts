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
 */
const OPD_WALLET_ORIGIN = 'http://localhost:4500'; // matches OPD_WALLET_PUBLIC_PATH in projects/member/webpack.config.js

@Pipe({ name: 'remoteAsset' })
export class RemoteAssetPipe implements PipeTransform {
  transform(path: string | null | undefined): string {
    if (!path) return '';
    if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
      return path;
    }
    return `${OPD_WALLET_ORIGIN}/${path.replace(/^\/+/, '')}`;
  }
}
