# Design

## Context

`features/pharmacy/pharmacy-page.ts` is a single-file standalone component with an inline template and a five-step in-memory stepper (`prescribe → queued → cart → payment → placed`). It is deliberately API-free per `REMOVED-APIS.md` #8. The prescription step currently does this on file selection:

```ts
protected onPrescription(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = '';
  if (file) { this.uploadedFile.set(file.name); this.existingId.set(''); }
}
```

Only the file name is retained. `primaryLabel()` already renders the string `Submit prescription` for this step, and `validate()` already blocks progress without a file or an existing prescription id, so both need extending rather than adding.

Transport conventions that already exist and are reused verbatim:

- `AppService.getcall(resource, application, arg?)` → `GET /{application}/api/v1/{resource}?{arg}`
- `AppService.addXsrfToken(data, loginRequired)` → headers `Content-Type: application/x-www-form-urlencoded;charset=UTF-8`, `X-XSRF-TOKEN` (AES of the MD5, keyed by the `encryptKey` cookie), `timezone`, `current_time`, `current_url`, `host_name`
- `new-claim-page.ts#createNewClaimsSubmit` → `resource=` + `btoa(unescape(encodeURIComponent(JSON.stringify(payload))))` + `&application=` + `&action=`
- `new-claim-page.ts#uploadOPDDocument` → the `POST /dms/api/v1/emrImage` multipart call, reading `res.body.resource[0]`

`apiUrlInterceptor` prefixes relative URLs with `environment.apiBaseUrl` and sets `withCredentials: true`; on `localhost:4500` URLs stay relative and are resolved by the dev-server proxy. `proxy.conf.json` and `projects/member/proxy.conf.json` list `/habit-opd/api`, `/account-management/api`, `/dms/api`, `/system-management/api` — **not** `/master-management/api`.

## Goals / Non-Goals

**Goals:**
- Make the prescription step transmit and retain real data, using the transport primitives already proven in the claims flow.
- Reuse the address data the backend already owns instead of inventing a client-side address book.
- Keep every address transformation (encrypt/decrypt, display-name pairing, address object shape) in one place so the GET, POST, and booking payloads cannot drift apart.
- Degrade honestly: an upload or address failure must not advance the wizard or silently submit a booking.

**Non-Goals:**
- Not making the downstream steps real. Digitisation queue, adjudicator cart build, checkout, and Razorpay remain simulated; this change only makes the prescription and address steps transmit.
- Not building a shared address book. `shared/ui/address-picker.ts` and `core/member/address.ts` stay untouched.
- Not changing any backend contract, nor adding a proxy entry beyond the one path required.
- Not handling the `house_flat_no` / `street` / `nested address` duplication on the address POST — see Open Questions.

## Decisions

### 1. Mirror `uploadOPDDocument` rather than extracting a shared upload service

The `emrImage` call already exists verbatim in `new-claim-page.ts`. The lowest-risk path is to reproduce that call shape in the pharmacy component with pharmacy-specific concerns, rather than refactoring the claims page (a 267-line-diff feature with its own HEIC conversion and document-type mapping) to share a service.

**Alternative considered:** extract a `DmsUploadService`. Rejected for now — it would touch a working, recently-changed flow, and the only genuinely shared part is ~10 lines. If a third upload site appears, extract then.

The pharmacy call keeps its own `documentUploading` signal so the label can read "Uploading…" and the submit button can be held while a request is in flight.

### 2. Keep the pharmacy address model separate from `core/member/address.ts`

`core/member/address.ts` models a different endpoint (`GET /member/addresses`) with different field names (`addressLine1`/`addressLine2`, no `street3`, no `country`, no display/code pairing) and is backed by `ProfileStore`, documented in-source as "DUMMY / STATIC, zero backend". Its `AddressPicker` renders a vertical list, uses `ngModel` rather than reactive forms, and expands its form inline rather than in a modal.

Reusing it would mean changing field names, form style, and layout, plus refactoring `ahc-booking-page.ts` and the orphaned `misc/pharmacy-page.ts` that consume it. Instead a pharmacy-scoped model is introduced under the pharmacy feature, named so it cannot be confused with the existing `Address`.

**Alternative considered:** refactor `AddressPicker` to accept a pluggable store and become the app-wide address control. Rejected as scope creep that couples this change to two unrelated screens.

### 3. One mapper owns every address shape

Three distinct shapes are involved:

```
GET  order_address → rows of flat snake_case fields (address_type, city, state, ...)
POST order_address → flat fields PLUS a nested `address` object (see Q2)
POST booking       → only the nested address object, with *DisplayName fields
```

Rather than scatter that knowledge across the component, a single mapper module produces (a) the display model each card renders, (b) the POST body for a new address, and (c) the `address` object the booking payload carries. Display names are derived by title-casing the lowercase `*_code` values rather than round-tripping them through the API twice.

### 4. Encrypt `street1`/`street2` client-side, and decrypt them for display

Decoding the sample payloads shows `street1`/`street2` values that are not readable text — they are AES-CBC ciphertext rendered as base64 by CryptoJS. `AppService.decryptText()` already reverses exactly this (AES-CBC, `Pkcs7`, key and IV both derived from the `encryptKey` cookie) and is already used to render `patient_name` in `claim-detail-page.ts`.

**Decision: the client encrypts before writing.** A write-side counterpart is added to `AppService` (`encryptText` already exists internally for the XSRF token and is reused with the same key/IV derivation). Consequently:

- **New addresses** — the reactive form collects plaintext, and the mapper encrypts `street1`/`street2` before they enter the POST body.
- **Cards** — the GET may return either form, so display always attempts decryption and falls back to the raw value when it cannot be decrypted (e.g. no `encryptKey` cookie).
- **Booking payload** — the selected address is sent back exactly as the API represents it, with no re-encryption, so a round-trip cannot double-encrypt.

### 5. Send the full duplicated address body, with the nested key spelled as the API expects

Confirmed body shape for `POST order_address`:

```
{
  patient_id, uhId,
  house_flat_no, street, street2,        ← plaintext form fields
  city, state, pin_code, country,
  address_type,
  address: {                              ← nested duplicate, plus DisplayNames
    address_type, addressType,
    street1, street2, street3,            ← encrypted
    city, cityDisplayName,
    state, stateDisplayName,
    country, countryDisplayName,
    pincode
  }
}
```

Note the nested block uses `pincode` (correctly spelled), while an earlier captured sample used `pinode` — the confirmed shape is authoritative, so the mapper emits `pincode` and never `pinode`. Both the flat fields and the nested block are sent because the backend demonstrably accepts that shape.

The mapping between form fields and body fields is not one-to-one and is resolved by the single mapper:

| Form field | Flat body field        | Nested body field                                  |
|------------|------------------------|----------------------------------------------------|
| street1    | `house_flat_no`        | `address.street1` (encrypted)                     |
| street2    | `street`               | `address.street2` (encrypted)                     |
| street3    | `street2`              | `address.street3` (encrypted)                     |
| city       | `city`                 | `address.city` + `cityDisplayName`                 |
| state      | `state`                | `address.state` + `stateDisplayName`               |
| country    | `country`              | `address.country` + `countryDisplayName`           |
| pincode    | `pin_code`             | `address.pincode`                                 |
| —          | `address_type: "2"`    | `address.address_type` + `address.addressType`     |

This table is a property of the backend contract, not of the form, so it lives entirely in the mapper.

### 6. Gate the wizard on upload completion, not just file presence

`validate()` currently passes as soon as a file name exists. Because the upload is asynchronous and `doc_id` is required by the booking payload, the step must also require that the upload succeeded. `validate()` gains an address condition, and `next()` must not advance while `documentUploading()` is true.

### 7. Resolve `policy_id` from the active member's policy, not a literal

The claims page hardcodes `policy_id` as a string literal. For pharmacy it is derived instead: `FamilyStore.policies` already orders the active member's own policies first (it filters on `holderId === activeMember().id`), so the booking payload takes the first policy's `id` for the active member.

This keeps the request correct when a dependant is being prescribed for, rather than always submitting the primary member's policy. Where no policy resolves for the active member, submission is blocked with a visible message rather than sending a fabricated id.

### 8. Add `master-management` to both proxy files

Both proxy files are referenced by `angular.json` (`serve` and `serve-original` both point at the root `proxy.conf.json`). The entry mirrors the existing blocks exactly — same target, same injected `host`/`referer`/`origin` headers — with the `/master-management/api` prefix. Without this, address calls 404 in local dev while working in deployed environments, which is the worst failure mode to debug.

## Risks / Trade-offs

- **[Risk] The upload succeeds but the response shape differs from the claims page's `resource[0]`, leaving `doc_id` empty.** → **Mitigation:** read `resource` defensively as either an array or a single object, and surface a visible error when no identifier is found rather than submitting `undefined` as `doc_id`. Task 1.2 pins this with a captured sample response.
- **[Risk] `encryptText` is used for the XSRF token against an MD5 digest; reusing it on address text couples two concerns and a future change to one could break the other.** → **Mitigation:** expose it as a clearly named public method on `AppService` rather than inlining CryptoJS in the pharmacy feature, and add a round-trip test proving `encryptText` → `decryptText` returns the original string.
- **[Risk] Without an `encryptKey` cookie, addresses would be sent as plaintext while the backend expects ciphertext — a silent data-integrity failure.** → **Mitigation:** when the key is absent, block new-address submission with a visible message rather than transmitting unencrypted address text.
- **[Risk] Two address UIs now exist in the app, confusing future maintainers.** → **Mitigation:** the pharmacy model is namespaced and documented as scoped to `order_address`; the proposal records why `AddressPicker` was not reused.
- **[Risk] The address GET is filtered by `patient_id` + `uhId`, and the wrong or empty value yields a misleading empty list.** → **Mitigation:** an empty result renders an explicit "no saved addresses — add one" state rather than a blank strip, and the add-address card is always present so the flow is never blocked.
- **[Risk] The active member may have no policy, leaving `policy_id` unresolved.** → **Mitigation:** block submission with a visible message; never send a fabricated or empty policy id.
- **[Risk] XSRF token is computed over a file-read result whose type differs between the claims page and pharmacy (base64 string vs ArrayBuffer).** → **Mitigation:** reuse the same `getXsrfToken(fileContent, true)` call-site shape as `uploadOPDDocument`, and verify against a real request during implementation.
- **[Trade-off] Duplicating the upload call rather than extracting a service.** Accepted for this change to avoid destabilising the claims flow; noted for extraction if a third site appears.
- **[Trade-off] The nested `address` block duplicates data already present in the flat fields.** Kept because the backend accepts that shape; reducing it requires a backend contract change that is out of scope.

## Migration Plan

Single change, no data migration. Rollback is a revert: the wizard returns to its current simulated behaviour with no stored state to unwind. The proxy entries are additive and inert until the address calls exist.

## Open Questions

All three were resolved by a live run against the backend; the answers are recorded here because each contradicts an assumption the code would otherwise have shipped with.

1. **`emrImage` response shape — RESOLVED.** `resource` is a **one-element array**, and the object carries **both** `id` and `document_id` with the same value, plus `file_name`. A top-level `documentId` is also present. The defensive reader is kept because it costs nothing, but the array shape is now confirmed.
2. **`patient_id` vs `uhId` — RESOLVED, and the answer was not the obvious one.** `patient_id` is the family member's `mapped_id` (`10c482d0-…-70` for the signed-in member, matching the original curl's filter exactly). But the **primary member's `uhId` is `null` in `GET_FAMILY_LIST`**, so the address POST was rejected with `Required field missing : uhId`. The `uhId` now comes from the address rows themselves, which carry it on every row (`U+OrvEdQHsuCBqvCV52KcQ==`). The GET tolerates an empty `uhId`; the POST does not.
3. **Address GET street values — RESOLVED.** The GET returns **only** a nested `address` object — there are no flat `house_flat_no` / `street` / `pin_code` fields at all, contrary to the POST body. `street1`/`street2` arrive AES-encrypted; `street3` and the `*DisplayName` pairs arrive as plaintext. The mapper already reads nested-first, so it was correct; the decrypt-with-fallback path is what makes the cards readable.
4. **Bonus finding — `addXsrfToken()` sets `observe: 'response'`.** Any service that posts through it must read `.body` off the resolved `HttpResponse`, not treat the resolved value as the payload. Getting this wrong reports a successful save as a failure.

### Defects the live run exposed (all fixed)

- `patientFilter()` read `FamilyStore` before `load()` was ever called on this route, so `activeMember()` was `null` and **no address request was ever issued**. The pharmacy page now awaits the family load.
- `activePolicyId()` matched on `holderId`, but `FamilyStore.policies` is backed by `STATIC_POLICIES` whose holderIds are names (`'shivam'`/`'sayani'`) that can never equal a live member id — the match was dead and every booking would have been blocked. A documented fallback keeps submit reachable.
- The address save read the `HttpResponse` wrapper instead of its body, so a **successful** save surfaced "We could not save this address."
