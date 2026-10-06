# Tasks

## 1. Prescription Upload

- [x] 1.1 Add a `documentUploading` signal and an `uploadedDocId` signal to `pharmacy-page.ts`, replacing the file-name-only `uploadedFile` as the value that gates progression, and verify the upload container renders an in-progress state while a request is open
- [x] 1.2 Replace `onPrescription()` with a call to `POST /dms/api/v1/emrImage` using multipart `FormData` (`file`, `fileName`, `action`) and `AppService.getXsrfToken()` for the `X-XSRF-TOKEN` header, mirroring `uploadOPDDocument` in `new-claim-page.ts`; capture one real response and confirm whether `resource` is an array or an object and whether the identifier field is `id` or `document_id`
- [x] 1.3 Read the identifier from `resource` tolerating both array and single-object shapes, treat a response with no identifier as a failure, and verify via a focused test that both shapes yield the identifier and an empty resource surfaces an error
- [x] 1.4 Verify `validate()` blocks the step while an upload is in flight or has failed, and that `next()` cannot advance until the upload settles

## 2. Address Service and Mapper

- [x] 2.1 Add `master-management` entries to both `proxy.conf.json` and `projects/member/proxy.conf.json` mirroring the existing proxy blocks, and verify an address GET reaches the backend in local dev instead of 404ing
- [x] 2.2 Confirm from a real request whether `patient_id` is the family member's `id` and `uhId` is their `uhid`, and pin the mapping with a test
- [x] 2.3 ~~Expose `encryptText` as a public method on `AppService` using the same key and IV derivation as `decryptText`, and verify an `encryptText` → `decryptText` round-trip returns the original string~~ — **withdrawn.** No key is available in this app and the API accepts plaintext streets, so the write-side `encrypt`/`hasEncryptKey` helpers were added and then removed as dead code. See design decision 4
- [x] 2.4 Create the pharmacy-scoped address model and mapper that produces the display model, the `POST order_address` body (flat fields plus the nested `address` block, with the nested pincode key spelled `pincode`), and the booking `address` object, and verify tests cover the street1/house_flat_no, street2/street, street3/street2, and DisplayName mappings
- [x] 2.5 Implement `GET order_address` via `AppService.getcall()` with the patient filter, and verify the mapper renders readable street text by attempting decryption and falling back to the raw value when decryption is unavailable
- [ ] 2.6 Fetch `api_encryption_key` from `GET_MY_CONFIG` (`account-management/api/v1/application_master`) and store it as the session key, and decrypt `street1`/`street2` with two passes — one pass yields ciphertext rather than the street, which is why this silently failed. Blocked: the endpoint needs a session the browser does not yet hold

## 3. Address Cards and Add-Address Modal

- [x] 3.1 Create the horizontal scrolling address card strip with a selected state, an explicit empty state when no addresses exist, and an always-present add-address card; verify the selected card is marked, selection is exclusive, and the empty state invites adding one
- [x] 3.2 Create the add-address modal with a reactive form exposing `street1`, `street2`, `street3`, `city`, `state`, `pincode`, and `country`, and verify each field is bound and the modal opens and dismisses without side effects
- [x] 3.3 Add client-side validation requiring the mandatory fields and a valid pincode, and verify an invalid form shows a field-level message and sends no request
- [x] 3.4 Submit the new address through `POST order_address` with the street fields as plaintext (encryption was removed — see decision 4), prepend the returned address to the cards, and verify the modal closes and the new address is selectable
- [x] 3.5 Surface address-load and address-save failures — a failed load leaves the add-address path usable, and a failed save keeps the modal open with input preserved — and verify both behaviours
- [x] 3.6 Identify each card by address type: resolve `address_type` to a readable label with a matching icon, fall back to `Other` for unrecognised codes, and give the add-address card the same flex skeleton so heights and the selection baseline align
- [x] 3.7 Send a `uhId` within the 128-character API limit, preferring the family record's plaintext value over the encrypted one carried on address rows, and truncate as a last-resort guard
- [x] 3.8 Surface the API's refusal message when a save is rejected, including a rejection delivered with a success status and an error code in the body
- [ ] 3.9 Wire the edit affordance to the update endpoint once it exists. The card output, prefill mapper and modal inputs are in place but the button is hidden; `POST order_address` only creates rows, so submitting an edit through it would add a duplicate address

## 4. Booking Submission

- [x] 4.1 Require both a completed upload and a selected address in `validate()`, and verify the wizard blocks with the correct message and sends nothing when either is missing
- [x] 4.2 Send `POST habit-opd/api/v1/opd_pharmacy_booking` with `resource=` base64-encoded JSON carrying the uploaded document id, the resolved policy id, and the selected address, reusing the `AppService.addXsrfToken()` header set
- [x] 4.3 Resolve `policy_id` from the active member's own policy via `FamilyStore.policies`, and verify a dependant's booking carries that dependant's policy rather than the primary member's
- [x] 4.4 Block submission with a visible message when no policy resolves for the active member, and verify no request is sent with an empty policy identifier
- [x] 4.5 Verify a failed booking request surfaces an error and leaves the uploaded prescription and selected address intact on the step

## 5. Verification

- [x] 5.1 Run diagnostics on all changed TypeScript files and confirm no new errors are introduced
- [ ] 5.2 Exercise the flow end to end on `localhost:4500` — upload, address load, address add, select, submit — and confirm each request reaches its backend and the wizard advances only on success
- [x] 5.3 Validate the OpenSpec change and review the final diff to confirm no unrelated files changed, in particular that `shared/ui/address-picker.ts`, `core/member/address.ts`, and the claims upload flow are untouched

## 6. Past Orders

- [x] 6.1 Create a `pharmacy-order.model.ts` that maps a `GET_PHARMACY_BY_USER` row to a display model, exposing `totalItems`, `totalAmount` and `status` as nullable because the payload omits them, and coalescing a non-numeric value to null rather than `NaN`
- [x] 6.2 Implement the paged read via `AppService.getcall('opd_pharmacy_booking', 'habit-opd', 'queryId=GET_PHARMACY_BY_USER&page_no=…&page_size=…')`, treating a missing `resource` as an empty page rather than throwing, since a refusal arrives as a success status with `errCode: -1`
- [x] 6.3 Load the first page when the page loads rather than on the "Order medicines" click, since the past-orders list is the landing view and would otherwise show an empty state the member never asked for
- [x] 6.4 Derive `page_no` from the accumulated row count and decide "load more" by comparing loaded rows against the API's `count`, so paging stays correct when the API returns fewer rows than the requested page size
- [x] 6.5 Surface a load failure instead of reporting it as an empty history. The service previously caught every error and returned an empty page, which made `0 < 0` hide the load-more control and rendered "you have no past orders" for a request that never completed
- [x] 6.6 Create `pharmacy-past-orders.ts` rendering the booking name, formatted creation date and locality, omitting item count, amount and status while the payload omits them
- [ ] 6.7 Render the street lines on past booking cards once the encryption key for this endpoint is available. Every street value in the sample payload is ciphertext that `decryptText` cannot open with the known key, so the card shows locality only
- [x] 6.8 Replace the accumulating "load more" with a page-number pager: an explicit `ordersPage` signal as the cursor, `page_size` of 5, rows replaced rather than appended on each change, and a Prev/Next control showing "Page N of M" with the bounds disabled
- [x] 6.9 Carry a `hasTotal` flag from the read so the page can tell an absent `count` from a genuine total equal to the row count, and derive the page count from `count` when it is present
- [x] 6.10 Scroll the past-orders heading back into view on a page change, since otherwise the member sees identical cards with only the counter changed
- [x] 6.12 Render the page navigation unconditionally rather than hiding it when the total is unknown, disabling both controls and reducing the counter to "Page N" — a hidden pager tells the member nothing about whether more history exists, and `count` is absent from the current payload
- [ ] 6.11 Confirm the paging semantics against the live backend once `count` is returned: whether it is the total across all pages rather than the current page's row count. A rejected request presents as a failure banner with no rows, and the pager stays inert until a total arrives
