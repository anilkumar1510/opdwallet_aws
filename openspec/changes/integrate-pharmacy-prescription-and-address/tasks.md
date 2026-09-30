# Tasks

## 1. Prescription Upload

- [x] 1.1 Add a `documentUploading` signal and an `uploadedDocId` signal to `pharmacy-page.ts`, replacing the file-name-only `uploadedFile` as the value that gates progression, and verify the upload container renders an in-progress state while a request is open
- [x] 1.2 Replace `onPrescription()` with a call to `POST /dms/api/v1/emrImage` using multipart `FormData` (`file`, `fileName`, `action`) and `AppService.getXsrfToken()` for the `X-XSRF-TOKEN` header, mirroring `uploadOPDDocument` in `new-claim-page.ts`; capture one real response and confirm whether `resource` is an array or an object and whether the identifier field is `id` or `document_id`
- [x] 1.3 Read the identifier from `resource` tolerating both array and single-object shapes, treat a response with no identifier as a failure, and verify via a focused test that both shapes yield the identifier and an empty resource surfaces an error
- [x] 1.4 Verify `validate()` blocks the step while an upload is in flight or has failed, and that `next()` cannot advance until the upload settles

## 2. Address Service and Mapper

- [x] 2.1 Add `master-management` entries to both `proxy.conf.json` and `projects/member/proxy.conf.json` mirroring the existing proxy blocks, and verify an address GET reaches the backend in local dev instead of 404ing
- [x] 2.2 Confirm from a real request whether `patient_id` is the family member's `id` and `uhId` is their `uhid`, and pin the mapping with a test
- [x] 2.3 Expose `encryptText` as a public method on `AppService` using the same key and IV derivation as `decryptText`, and verify an `encryptText` → `decryptText` round-trip returns the original string
- [x] 2.4 Create the pharmacy-scoped address model and mapper that produces the display model, the `POST order_address` body (flat fields plus the nested `address` block, with the nested pincode key spelled `pincode`), and the booking `address` object, and verify tests cover the street1/house_flat_no, street2/street, street3/street2, and DisplayName mappings
- [x] 2.5 Implement `GET order_address` via `AppService.getcall()` with the patient filter, and verify the mapper renders readable street text by attempting decryption and falling back to the raw value when decryption is unavailable

## 3. Address Cards and Add-Address Modal

- [x] 3.1 Create the horizontal scrolling address card strip with a selected state, an explicit empty state when no addresses exist, and an always-present add-address card; verify the selected card is marked, selection is exclusive, and the empty state invites adding one
- [x] 3.2 Create the add-address modal with a reactive form exposing `street1`, `street2`, `street3`, `city`, `state`, `pincode`, and `country`, and verify each field is bound and the modal opens and dismisses without side effects
- [x] 3.3 Add client-side validation requiring the mandatory fields and a valid pincode, and verify an invalid form shows a field-level message and sends no request
- [x] 3.4 Submit the new address through `POST order_address` with the encrypted street fields, prepend the returned address to the cards, and verify the modal closes and the new address is selectable
- [x] 3.5 Surface address-load and address-save failures — a failed load leaves the add-address path usable, and a failed save keeps the modal open with input preserved — and verify both behaviours

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
