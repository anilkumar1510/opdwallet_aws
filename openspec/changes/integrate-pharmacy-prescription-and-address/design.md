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

### 4. Street values are written as plaintext; `street1`/`street2` cannot yet be read back

**Superseded by a live run.** The original decision here was to encrypt `street1`/`street2` client-side and decrypt them for display. Both halves of that turned out to be wrong, and the corrections are recorded because the reasoning is not recoverable from the code.

- **The key does not come from a cookie.** `AppService` reads an `encryptKey` cookie in its constructor, but the server never sets one — the key arrives as `api_encryption_key` in the `GET_MY_CONFIG` response (`account-management/api/v1/application_master`), which is how the reference portal populates `_currentSessionData.encryptKey`. Nothing in this app fetches it, so `decryptText` sees no key and returns its input unchanged.
- **The values are encrypted twice.** Against a live `GET_MY_CONFIG` sample with key `5FA45885C8B77DB07FFFBEDDEE2C8319`, `Ps9W/YTwo91CeXO+cSim/HJ0yMSMWv0Bq+HT0FLlJWU=` decrypts to `+ypmQuYT6WxL2SxV+ctxCw==` on the first pass and `Sector 24` on the second. Re-encrypting `Sector 24` reproduces the original ciphertext byte-for-byte. A single pass is worse than useless: it returns non-empty output, so a fallback that checks for failure never triggers and the card silently renders base64.
- **The API accepts plaintext on write.** The client no longer encrypts anything; `toOrderAddressBody` sends every street field as typed, and the POST is accepted.

Consequently the cards show **`street3` only** — the one plaintext street field — until `api_encryption_key` is fetched and two decrypt passes are wired. `street1`/`street2` remain stored and returned correctly; only the portal's ability to *display* them is outstanding.

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

### 8. Cards identify an address by type, not by raw code

`address_type` arrives as a bare `"2"`, which tells a member nothing. The mapper resolves it to a label (`Home` / `Office` / `Other`, falling back to `Other` rather than echoing an unrecognised code) and the card pairs it with a matching icon from the shared set. Streets and locality are rendered as separate blocks — the streets in the body, city/state/pincode below a divider — so a member can tell two similar addresses apart at a glance. Both the add-address card and each address card share one flex skeleton (`items-stretch`, body in `flex-1`) so heights and the selection button's baseline line up across the strip.

### 9. Edit is local-only until the update endpoint exists

`POST order_address` creates a row; it has no update semantics. Submitting an edited address through it would silently add a *second* address rather than change the one the member edited. Edit therefore updates the in-memory list and skips the request entirely, the button reads "Update address", and the change is lost on reload. The `editRequested` wiring, the prefill mapper and the modal's `initial`/`heading` inputs all remain in place — currently unreachable from the UI — so enabling the real endpoint is a matter of restoring one binding.

### 10. `uhId` is capped at 128 characters, plaintext preferred

The address rows carry the member's `uhId` **encrypted** — 152 characters against a 128-character API limit, which the POST rejects with `Length for uhId should not be greater than 128`. Decrypting is not a fix: one pass still yields ciphertext rather than a `uhId`, so a "decrypt until it fits" rule would pass validation and persist a corrupt id. Instead the family record's plaintext `uhId` (`HH-371683`) is preferred, the address row is used only when it fits the limit, and `toOrderAddressBody` truncates as a last-resort guard so an over-long value can never reach the API from any caller.

### 11. Save failures surface the API's own message

The address service discarded the refusal body and always reported "We could not save this address", which sent diagnosis to the network tab. A `200` carrying `errCode: -1` is a rejection, not a success, so the `message` is now extracted and shown in the modal.

### 12. Add `master-management` to both proxy files

Both proxy files are referenced by `angular.json` (`serve` and `serve-original` both point at the root `proxy.conf.json`). The entry mirrors the existing blocks exactly — same target, same injected `host`/`referer`/`origin` headers — with the `/master-management/api` prefix. Without this, address calls 404 in local dev while working in deployed environments, which is the worst failure mode to debug.

### 13. Past orders get their own model, service and component

The past-orders list was a hardcoded `PAST_ORDERS` array of twelve invented rows. It is now read from `habit-opd/api/v1/opd_pharmacy_booking?queryId=GET_PHARMACY_CART_BY_USER`, which is the same shape `claims.store.ts` already uses against `GET_CLAIMS_BY_USER` on the same microservice: `page_no` and `page_size` as top-level parameters, no `args=` envelope.

The model, service and card list are kept in three files separate from the address ones. `PharmacyAddress` models the `master-management` `order_address` contract and names its fields `street1`/`house_flat_no`; these rows carry their own `address` block whose streets are ciphertext under a different key. Merging them would collide on field names and silently mix two contracts.

**Fields the payload does not carry.** There is no item count, no amount and no status, so `totalItems`, `totalAmount` and `status` are typed `number | null` / `string | null`. The card omits those regions entirely instead of rendering `0`, `—` or a guessed badge, and the nullable types mean the card fills in with no code change once the fields ship. `num()` coalesces a non-numeric value to `null` rather than letting `NaN` reach the template.

**`name` is shown as the prescription line.** The row carries a `doc_id` UUID but no `RX-…` reference, and `name` (`OPD-2026-00027`) is the identifier a member recognises, so it occupies that line.

### 14. A failed past-orders load must not read as an empty history

The service originally caught every error and returned `{ orders: [], count: 0 }`. That made a rejected request indistinguishable from a genuinely empty list: `hasMoreOrders` is `rows < count`, so `0 < 0` is false and the load-more control stayed hidden, while the template rendered "You have no past orders yet." — a factual claim about the member's history that was never verified. The catch is removed so the failure reaches the page, which shows a failure state instead.

Paging uses the accumulated row count as `page_no` rather than a separate counter, so the second request asks for page 3 when the first returned 3 rows — not page 5. This only holds while every fetched row is appended exactly once; a client-side filter would desynchronise the cursor and require a dedicated `ordersLoaded` counter.

- **[Risk] Past booking rows carry a different encryption key than `order_address`.** Every street value in the sample payload returns unchanged through `decryptText`, so the cards cannot show street text and show locality only. → **Mitigation:** omit rather than render ciphertext; tracked as task 6.7.
- **[Risk] `pastOrders().length` does double duty as render list and paging cursor.** A client-side filter would shift the cursor and silently re-fetch a page. → **Mitigation:** documented on the decision; add a dedicated counter before any filtering is introduced.

### 15. A page-number pager, not an accumulating "load more"

The past-orders list pages with an explicit `ordersPage` signal and replaces the rows on each request, rather than appending to them. `page_size` is 5 and the control is a Prev/Next pager with a "Page N of M" counter, because `count` is already returned and the member is moving between discrete pages rather than extending an endless list.

Appending and paging cannot share state. With append, `page_no` was derived from `pastOrders().length`, which happens to work only while rows accumulate monotonically. A pager navigates backwards, so after moving to page 2 and back to page 1 the array is still 5 rows long and the derived cursor would re-request page 5. An explicit page signal is the only correct cursor.

**This is the first true pager in the codebase.** Every other list either reveals a client-side slice (`claims-page.ts`) or refetches a longer window and replaces the list (`wallet.store.ts`). Server-side `page_no` is available on this endpoint, so the app-wide convention is followed in spirit — paginate rather than truncate — while the control itself is new.

Changing page scrolls the list heading back into view. Without it, activating Next on a long page leaves the member looking at the same cards with only the counter changed, which reads as a broken control.

The pager derives its bounds from `count`: `pageCount = ceil(count / page_size)`, Next disabled at the last page and Previous on the first.

**The controls are always present, and inert when the total is unknown.** `GET_PHARMACY_CART_BY_USER` does not return `count` today, so there is no honest "of M" to show. Hiding the pager entirely would tell the member nothing about whether more history exists; showing it greyed out says the feature exists and is simply unavailable. It therefore renders unconditionally, both buttons carry `disabled`, and the counter degrades from "Page 1 of 4" to "Page 1". The page also carries `ordersHaveTotal`, set from a `hasTotal` flag on the read result, because the fallback value for `count` is this page's row count — indistinguishable from a genuine total of the same number. Without the flag a real five-row total and an unknown total are the same value, and the pager would silently promise pages that do not exist.

## Risks / Trade-offs

- **[Risk] The upload succeeds but the response shape differs from the claims page's `resource[0]`, leaving `doc_id` empty.** → **Mitigation:** read `resource` defensively as either an array or a single object, and surface a visible error when no identifier is found rather than submitting `undefined` as `doc_id`. Task 1.2 pins this with a captured sample response.
- **[Risk] `encryptText` is used for the XSRF token against an MD5 digest; reusing it on address text couples two concerns and a future change to one could break the other.** → **Resolved by removal.** The write-side `encrypt`/`hasEncryptKey` helpers turned out to have no callers once street encryption was dropped, and `encrypt` would have thrown on any call because no key is present. They are deleted rather than kept for symmetry.
- **[Risk] Without an `encryptKey` cookie, addresses would be sent as plaintext while the backend expects ciphertext — a silent data-integrity failure.** → **Superseded.** A live POST with plaintext streets was accepted, and no key is present in this app at all. See decision 4.
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
2. **`patient_id` vs `uhId` — RESOLVED twice, and the second answer reversed the first.** `patient_id` is the family member's `mapped_id` (`10c482d0-…-70` for the signed-in member, matching the original curl's filter exactly). The **primary member's `uhId` is `null` in `GET_FAMILY_LIST`**, so the first fix took `uhId` from the address rows. Those rows turned out to carry it **encrypted** — 152 characters against a 128-character limit — and the POST was rejected with `Length for uhId should not be greater than 128`. The plaintext value is preferred where one exists; see decision 10.
3. **Address GET street values — RESOLVED.** The GET returns **only** a nested `address` object — there are no flat `house_flat_no` / `street` / `pin_code` fields at all, contrary to the POST body. `street1`/`street2` arrive encrypted, `street3` and the `*DisplayName` pairs arrive as plaintext. The mapper already reads nested-first, so it was correct. The values are encrypted **twice**, and the key comes from `GET_MY_CONFIG` rather than a cookie — see decision 4.
4. **Bonus finding — `addXsrfToken()` sets `observe: 'response'`.** Any service that posts through it must read `.body` off the resolved `HttpResponse`, not treat the resolved value as the payload. Getting this wrong reports a successful save as a failure.
5. **`errCode: -1` arrives with HTTP 200.** A refusal is not signalled by the status code, so a save that only checks for transport success reports "could not save" with no reason. The message is now surfaced; see decision 11.

### Defects the live run exposed (all fixed)

- `patientFilter()` read `FamilyStore` before `load()` was ever called on this route, so `activeMember()` was `null` and **no address request was ever issued**. The pharmacy page now awaits the family load.
- `activePolicyId()` matched on `holderId`, but `FamilyStore.policies` is backed by `STATIC_POLICIES` whose holderIds are names (`'shivam'`/`'sayani'`) that can never equal a live member id — the match was dead and every booking would have been blocked. A documented fallback keeps submit reachable.
- The address save read the `HttpResponse` wrapper instead of its body, so a **successful** save surfaced "We could not save this address."
