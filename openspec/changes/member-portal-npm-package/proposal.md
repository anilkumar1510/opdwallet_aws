# Publish the Angular member portal as a private npm package

## Why

Requested: distribute `web-angular/projects/member` as a private npm package.

This **reverses a decision recorded in the active change**. `angular-member-portal/design.md:42`
lists "a shared component library across the six web apps" as out of scope —
*"Premature until a second Angular app needs it"* — and `:43` rules out
micro-frontend composition between `shell-tpa` and `member` on the grounds that
they are independent applications in one workspace. Nothing has changed about
`shell-tpa`: it is still a stub with an empty route table
(`projects/shell-tpa/src/app/app.routes.ts`).

So the "why now" is external to the codebase and is **not yet stated**. This
proposal records the work; it does not by itself supply the justification the
prior ruling would need to be overturned.

## What Changes

`member` is registered in `angular.json` as an **`application`**, not a
`library`. Applications are not consumable via npm — they bootstrap, they own an
`index.html`, and they have no public entry point. Making it a package is a
project-type conversion, not a publish flag.

- **Add a library build target.** `ng-packagr` is not installed; the
  `@angular/build:ng-packagr` builder *is* present in the installed
  `@angular/build`, and the registry is reachable (`ng-packagr@22.1.1`, verified
  2026-08-27 — the TLS-proxy block recorded for this machine did not reproduce).
  Add `projects/member/ng-package.json`, `projects/member/package.json`
  (scoped name, e.g. `@opdwallet/member`), and a `public-api.ts`.
- **BREAKING for the app: replace `environments/` with injected config.** A
  library cannot carry build-time environment files — the consumer owns that.
  `apiBaseUrl` and `agoraAppId` move behind an `InjectionToken` supplied by the
  consumer via a `provideMemberPortal(config)` function. The blast radius is
  small and known: 4 files import `environments/environment` today —
  `core/http/api.interceptors.ts`, `core/video/consultation.store.ts`,
  `features/consultations/consultation-room-page.ts`,
  `features/records/health-records-page.ts`.
- **Decide the package surface.** 22 feature folders exist under
  `features/`. Exporting all of them makes every internal component public API
  and freezes it. The alternative is exporting only the routes plus
  `provideMemberPortal`, keeping components internal.
- **Resolve Tailwind v4 styling.** The app styles via `styles.css` +
  `@tailwindcss/postcss`. ng-packagr does not ship a global stylesheet, so the
  consumer must either run the same Tailwind pipeline over the package's
  templates or the package must ship compiled component styles.
- **Choose a private registry.** No `.npmrc` exists anywhere in the repo and no
  scoped dependency is in use. npm private (paid), GitHub Packages (free with
  the existing `anilkumar1510/opdwallet_aws` repo), or a git-URL dependency
  (no registry, no auth, no publish step).

Every root `package.json` in the repo carries `"private": true` — that only
blocks accidental publish and is unrelated to a private *registry*.

## Capabilities

### New Capabilities

- `member-portal-packaging`: How the member portal is consumed by an
  application that does not own its source — its public entry point, the
  configuration a consumer must supply, and what is guaranteed across versions.

### Modified Capabilities

- `member-shell`: The shell currently reads configuration from build-time
  environment files. The requirement changes to: configuration is supplied by
  the host application, and the portal fails loudly when it is absent.

## Impact

- `web-angular/angular.json` — `member` gains a library build target.
- `web-angular/projects/member/` — new `ng-package.json`, `package.json`,
  `public-api.ts`; `src/environments/` removed; 4 files rewired to the token.
- `web-angular/package.json` — `ng-packagr` added.
- New `.npmrc` + registry credentials, once a registry is chosen.
- `angular-member-portal/design.md:42-43` — the out-of-scope entries must be
  amended or explicitly superseded, not silently contradicted.
- **Unblocked prerequisite:** `angular-member-portal/tasks.md:39` (task 4.8,
  browser verification of `member-shell`) is still open. Packaging a portal
  whose shell spec is unverified ships the gap downstream to consumers.

## Open questions

1. **Who consumes it?** `shell-tpa` is an empty stub; no second Angular app
   exists. Without a named consumer the public surface cannot be chosen, and
   the `design.md:42` ruling stands unrebutted.
2. **Package the whole portal, or the parts?** Whole-portal-as-a-route-tree and
   shared-component-library are different packages with different surfaces.
3. **Which registry**, and who holds the publish credentials?
