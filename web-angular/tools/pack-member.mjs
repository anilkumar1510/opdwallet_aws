#!/usr/bin/env node
/**
 * Packs the built member portal as a private npm tarball.
 *
 *   npm run pack:member          # builds, then packs
 *
 * This ships the *application*, not a library: the tarball is the static
 * browser bundle, and a consumer installs it and serves the files. It is not
 * importable — no Angular component or route in here can be pulled into
 * another app. That is the ng-packagr conversion tracked in
 * openspec/changes/member-portal-npm-package/, and it is a different job.
 *
 * The bundle hardcodes `apiBaseUrl: '/api'` (src/environments/environment.ts),
 * so whatever serves these files must proxy /api to the API. There is no
 * build-time knob for it here — a consumer that needs a different origin needs
 * the library conversion, not this.
 *
 * Scoped + access:restricted means npm refuses to publish it publicly by
 * accident. Publishing at all still needs a registry and credentials, which
 * are not chosen yet — this script only produces the tarball.
 */
import { execFileSync, execSync } from 'node:child_process';
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/member';
const OUT = join(DIST, 'browser');

if (!existsSync(join(OUT, 'index.html'))) {
  console.error(`No build at ${OUT}. Run: ng build member`);
  process.exit(1);
}

const { version } = JSON.parse(
  execFileSync('node', ['-p', 'JSON.stringify(require("./package.json"))'], {
    encoding: 'utf8',
  }),
);

writeFileSync(
  join(OUT, 'package.json'),
  JSON.stringify(
    {
      // GitHub Packages requires the scope to match the repo owner (anilkumar1510).
      // A differently-scoped name is rejected by npm.pkg.github.com, not just discouraged.
      name: '@anilkumar1510/member',
      version,
      description: 'OPD Wallet member portal — prebuilt static bundle. Serve these files; proxy /api to the API.',
      repository: { type: 'git', url: 'git+https://github.com/anilkumar1510/opdwallet_aws.git' },
      publishConfig: {
        access: 'restricted',
        registry: 'https://npm.pkg.github.com',
      },
      license: 'UNLICENSED',
    },
    null,
    2,
  ) + '\n',
);

// Attribution for the bundled third-party code travels with the bundle.
copyFileSync(join(DIST, '3rdpartylicenses.txt'), join(OUT, '3rdpartylicenses.txt'));

execSync(`npm pack ./${OUT}`, { stdio: 'inherit' });
