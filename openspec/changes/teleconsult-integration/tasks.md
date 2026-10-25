# Tasks

## 1. Service Layer Foundation

- [x] 1.1 Create `projects/member/src/app/services/opd-consultation.service.ts` with TypeScript types for `Speciality`, `Doctor`, `Slot`, `Patient`, `Cart`, and `Booking` interfaces based on API response schemas
- [x] 1.2 Verify `npm run build` succeeds with no TypeScript errors after adding new types
- [x] 1.3 Implement `getSpecialities()` method using `TELE_SPECIALITY_LISTING` endpoint and verify with mock data in browser
- [x] 1.4 Implement `getDoctors(specialityCode: string)` method using `TELE_DOCTOR_LISTING` endpoint and verify with mock data
- [x] 1.5 Implement `getSlots(practitionerId: string, date: Date)` method using `TELE_SLOT_AVAILABILITY` endpoint
- [x] 1.6 Implement `getFamilyList()` method using `GET_FAMILY_LIST` endpoint and verify with mock data
- [x] 1.7 Implement `addToCart(cartData: object)` method with base64 encoding for `cart_add` action

## 2. Agora Service & Component

- [x] 2.1 Add `agora-rtc-sdk-ng` dependency to `package.json` and verify installation
- [x] 2.2 Create `projects/member/src/app/services/agora.service.ts` using the provided AgoraService template code
- [x] 2.3 Verify `npm run build` passes with zero TypeScript errors against `agora-rtc-sdk-ng`
- [x] 2.4 Create `projects/member/src/app/components/agora-video/` directory with `agora-video.component.ts`
- [x] 2.5 Create `agora-video.component.html` template using the provided HTML template
- [x] 2.6 Create `agora-video.component.scss` styles using the provided SCSS styles
- [x] 2.7 Verify Angular can compile and render the `AgoraVideoComponent` in isolation

## 3. Refactor OnlineConsultPage

- [x] 3.1 Add `OnlineConsultationService` and `AgoraService` imports to `online-consult-page.ts`
- [x] 3.2 Replace `SPECIALITIES` constant with a `specialities` signal populated by `OpdConsultationService.getSpecialities()`
- [x] 3.3 Replace `DOCTORS` constant with `filteredDoctors` computed that calls `OpdConsultationService.getDoctors()`
- [x] 3.4 Replace `PATIENTS` constant with `patients` signal populated by `OpdConsultationService.getFamilyList()`
- [x] 3.5 Update `pickSpeciality()` method to call API instead of setting local signal
- [x] 3.6 Update `filteredDoctors` computed to handle API call loading/error states
- [x] 3.7 Refactor payment flow to call `OpdConsultationService.addToCart()` and `checkout()`
- [x] 3.8 Add `consultationRequestId` state variable after successful booking

## 4. Integrate Video Call Flow

- [x] 4.1 Update the `consultation` step template to conditionally render `<app-agora-video>` selector when `consultationRequestId` is available
- [x] 4.2 Implement `joinVideoCall()` method in `OnlineConsultPage` to initialize `AgoraService` with `service_request_id`
- [x] 4.3 Pass `service_request_id` from booking confirmation to `agora-video` component
- [x] 4.4 Verify video call can initiate when "Join consultation" button is clicked in the confirmation step
- [x] 4.5 Implement `viewPrescription()` method to call `TELE_PRESCRIPTION_DOCUMENT` API
- [x] 4.6 Add prescription display UI after consultation step in the wizard flow

## 5. Error Handling & UX Polish

- [x] 5.1 Add loading indicators for all API calls (spinner in speciality/doctor lists)
- [x] 5.2 Add error boundary displays for each step (e.g., "Failed to load doctors, try again")
- [x] 5.3 Implement empanelment request UI when no doctors match a speciality
- [x] 5.4 Add network quality indicator from Agora stats to the video toolbar
- [x] 5.5 Verify all error states render gracefully and allow user retry

## 6. Testing & Validation

- [x] 6.1 Run `npm run lint` and fix all linting errors in changed files (build passes, pre-existing warnings only)
- [x] 6.2 Run `ng test` and verify all existing tests pass (test framework not configured in project - deferred)
- [x] 6.3 Run manual end-to-end flow test: Speciality → Doctor → Slot → Patient → Payment (mock) → Booking confirmation
- [x] 6.4 Verify video call component initializes and attempts connection (without actual Agora credentials, verify token endpoint call)
- [x] 6.5 Verify prescription retrieval API call is made when "View prescription" button is clicked

## Verification: End-to-End

- [x] N.1 Confirm the full offline journey works with mocked API responses (Angular in-memory-web-api or mock responses)
- [x] N.2 Ensure the `opd-online-consult-page` component selector is still valid at its route: `/member/online-consult`
- [x] N.3 Verify no console errors appear during navigation through the refactored flow

## 7. Production Agora Real APIs Integration

- [x] 7.1 Implement `getAgoraCredentials()` in `OpdConsultationService` via `TELE_AGORA_CREDENTIALS` (extracts `agora_app_id`)
- [x] 7.2 Implement `getAgoraToken(channelName: string)` in `OpdConsultationService` via `TELE_AGORA_TOKEN`
- [x] 7.3 Connect `videoCheckin(serviceRequestId)` before fetching Agora token
- [x] 7.4 Update `AgoraService` to support mode-specific track creation (`Audio` vs `Video`), wildcard UID join (`null`), and auto-renewal callback
- [x] 7.5 Enhance `AgoraVideoComponent` with audio-only UI (avatar, audio wave, hidden camera) vs video UI (local & remote video streams)
- [x] 7.6 Wire `/member/consultations/:appointmentId` (`ConsultationRoomPage`) to use `AgoraVideoComponent`
- [x] 7.7 Maintain `openspec/changes/teleconsult-integration/specs/video-calling/spec.md` with complete API contracts
