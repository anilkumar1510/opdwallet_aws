# ADR-0001: Angular 21, zoneless and standalone, for the member portal

**Status**: accepted
**Date**: 2026-08-05

## Context

The member portal is being rebuilt in Angular as a new application in the existing `web-angular/` workspace, alongside the `shell-tpa` stub. The workspace has no `package.json`, so no Angular version is pinned anywhere — the first install sets the version for every project in it.

At the time of writing, npm publishes Angular `22.1.0` as `latest` and `21.2.19` on the `v21-lts` tag. The existing `shell-tpa` stub is generated v20-era output.

This is a port of roughly 65 screens. It will take longer than one major release cycle, so the version chosen now determines whether the team is porting screens or chasing an upgrade partway through.

## Decision

We will pin the workspace to Angular `~21.2` and the Angular CLI to the matching major.

We will run zoneless change detection via `provideZonelessChangeDetection()` and ship no `zone.js`.

We will use standalone components throughout. No NgModules.

## Consequences

The workspace sits on a supported LTS line for the duration of the port rather than tracking the newest major. The upgrade to 22 becomes a deliberate, separate change once the port is stable.

Zoneless is adopted at greenfield, when the cost is zero: this application's state is signals end to end, so there is no zone-dependent code to migrate and no third-party widget relying on patched globals. Retrofitting zoneless after 65 screens exist would mean auditing every one of them.

Any dependency added later that assumes `zone.js` — a widget that mutates state outside Angular's knowledge and expects the view to catch up — will not work without an explicit `ChangeDetectorRef` or signal write at the boundary. This constrains library selection for every future change, which is the point of recording it here.

Installing Angular 21 also sets the version for the `shell-tpa` stub. The stub has an empty route table and is a placeholder, so this is a version bump it does not notice; it is otherwise not modified.

Zoneless combined with the workspace's existing `strictTemplates` and `noPropertyAccessFromIndexSignature` settings is asserted from documentation, not from an observed build. The first implementation task verifies the workspace builds and serves before any feature work begins.
