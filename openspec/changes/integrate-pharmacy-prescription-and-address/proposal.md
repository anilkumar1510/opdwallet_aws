# Proposal

## Why

The Pharmacy page's "Upload a new prescription" step is a static simulation: selecting a file only records its name in a signal, no request is made, and "Submit prescription" advances a local stepper without transmitting anything. Members therefore cannot actually submit a prescription or choose a delivery address — the journey only appears to work. The rest of the flow (digitisation queue, adjudicated cart, checkout) is likewise local, but the prescription upload and address selection are the two steps with real backend contracts already identified, and they are the gate for a genuine pharmacy booking.

## What Changes

- Upload the selected prescription file to `POST /dms/api/v1/emrImage` as multipart form data immediately on selection, mirroring the pattern already proven in the New Claim page.
- Retain the upload response's document identifier (from `resource`) for use as `doc_id` in the subsequent booking request, replacing the file-name-only signal.
- Load the member's saved delivery addresses from `GET master-management/api/v1/order_address`, filtered by the active patient, and render them as horizontally scrolling cards.
- Add an "Add address" card to that strip which opens a modal containing a reactive form for `street1`, `street2`, `street3`, `city`, `state`, `pincode`, and `country`.
- Submit the new address to `POST master-management/api/v1/order_address` and prepend the returned address to the horizontal cards so it is immediately selectable.
- Identify each card by a readable address type with a matching icon, and separate the street text from city, state and pincode so similar addresses are distinguishable.
- Send a `uhId` within the API's 128-character limit, preferring the family record's plaintext value over the encrypted one carried on address rows.
- Surface the API's own refusal message when an address save is rejected, including rejections delivered with a success status.
- ~~Add `street1`/`street2` decryption for display~~ — **not delivered.** The values are double-encrypted and the portal holds no key, so the cards render `street3` only. Tracked as task 2.6.
- Require a selected delivery address alongside an uploaded prescription before "Submit prescription" is allowed to proceed.
- Send `POST habit-opd/api/v1/opd_pharmacy_booking` on submit, carrying `doc_id`, `policy_id`, and the selected address object.
- Replace the hardcoded past-orders array with a real read from `habit-opd/api/v1/opd_pharmacy_booking?queryId=GET_PHARMACY_BY_USER`, paged server-side and rendered by a dedicated component, showing only the fields the payload carries.
- Add the `master-management` API path to the Angular dev-server proxy configuration so the address endpoints resolve in local development.

**Behavioural boundary:** only the Pharmacy page's prescription step gains real backend calls. The subsequent simulated steps (adjudicator queue, cart build, checkout) remain unchanged in this change.

## Capabilities

### New Capabilities
- `pharmacy-prescription-booking`: Real prescription upload to the DMS image API, saved-address selection via the master-management order-address APIs, and submission of a pharmacy booking request that carries the uploaded document id and the chosen delivery address.

### Modified Capabilities

- None.

## Impact

- Affected code: `projects/member/src/app/features/pharmacy/pharmacy-page.ts` (single-file component with an inline template), plus a new address model/service in the pharmacy feature and a new address card/modal component pair.
- Existing APIs used unchanged: `POST /dms/api/v1/emrImage` (already called by the New Claim page), `GET/POST master-management/api/v1/order_address`, `POST habit-opd/api/v1/opd_pharmacy_booking`.
- Transport primitives reused rather than reinvented: `AppService.getcall()` for the address GET, `AppService.addXsrfToken()` for both POSTs, and the `btoa`-encoded `resource=` body shape used by the existing claim submission.
- New infrastructure: `master-management` must be added to `proxy.conf.json` and `projects/member/proxy.conf.json`; it is absent from both today.
- Existing `shared/ui/address-picker.ts` and `core/member/address.ts` are **not** reused. The picker is a vertical list backed by the zero-backend `ProfileStore`, uses template-driven forms rather than reactive forms, and renders its form inline rather than in a modal. Its `Address` type also names fields differently (`addressLine1`) from this API (`street1`), so reusing it would require refactoring two other screens.
- Dependencies: none added. `crypto-js` is already present via `AppService`.
- Open backend contract questions are recorded in `design.md` and gate the tasks that depend on them.
