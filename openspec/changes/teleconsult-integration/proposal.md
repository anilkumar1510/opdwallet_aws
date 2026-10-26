# Proposal

## Why

This change integrates the existing Teleconsultation journey APIs and Agora video calling functionality into the Angular frontend application, replacing the static dummy implementation with a real-world, production-ready patient consultation flow. The current implementation uses hardcoded JSON data for doctors, specialties, and consultation flows, which doesn't match the actual backend systems used by the healthcare organization.

This integration enables the complete end-to-end patient consultation journey:
1. Real-time doctor availability and search via Teleconsultation APIs
2. Instant messaging and appointment scheduling functionality
3. Virtual consultation room with video/audio calling via Agora RTC SDK
4. Digital prescription generation and management
5. End-to-end booking workflow from consultation to video call completion

## What Changes

### Core Integration Changes
- **API Integration Layer**: Replace static data with calls to Teleconsultation APIs:
  - Speciality listing (`TELE_SPECIALITY_LISTING`)
  - Doctor search/filtering (`TELE_DOCTOR_LISTING`) 
  - Slot availability (`TELE_SLOT_AVAILABILITY`)
  - Cart/booking (`cart_add`, `checkout`)
  - Booking confirmation (`book_appointment`)
  - Video checkin (`video_checkin`)
  - Prescription retrieval (`TELE_PRESCRIPTION_DOCUMENT`)

- **Agora Video Calling Integration**: Add real-time video consultation capabilities:
  - Agora service for video/audio tracks and signaling
  - Video call component for in-app video consultations
  - Token-based authentication for Agora channels
  - Real-time network statistics and quality monitoring

- **Enhanced Service Layer**: Create comprehensive service layer:
  - `OnlineConsultationService` for API calls and business logic
  - `AgoraService` for WebRTC management
  - `ConsultationBookingService` for end-to-end booking workflow

- **Updated Frontend Components**: Refactor existing `OnlineConsultPage` to:
  - Use reactive APIs instead of static data
  - Integrate video call component at consultation step
  - Handle loading states, errors, and user feedback
  - Maintain backward compatibility where possible

- **Business Logic Updates**: Implement required validation and workflow logic:
  - Doctor availability rules for "Consult Now" vs "Schedule" flows
  - Wallet integration and payment flow
  - Booking confirmation and invoice generation
  - Empanelment request functionality for unlisted doctors

### Affected Areas
- `projects/member/src/app/features/online-consult/` - Core consultation module
- `projects/member/src/app/services/` - New service implementations
- `projects/member/src/app/components/` - Video call component
- `projects/member/src/app/stores/` - Updated state management

## Capabilities

### New Capabilities
- `online-consultation/api-integration` - Integration with Teleconsultation backend APIs
- `online-consultation/video-calling` - Real-time video consultation capabilities
- `online-consultation/booking-workflow` - End-to-end booking from consultation to call
- `online-consultation/payment-integration` - Payment and wallet integration
- `online-consultation/digital-prescriptions` - Electronic prescription management

### Modified Capabilities
- `online-consultation/patient-flows` - Enhanced consultation flow (from static to dynamic API-driven)
- `online-consultation/user-journey` - Complete user experience from discovery to post-consultation follow-up

## Impact

### Direct Impact
- Replaced hardcoded 450+ lines of mock data with real-time API integrations
- Enabled real doctor search and scheduling functionality
- Added video consultation capabilities with Agora RTC SDK
- Integrated digital prescription workflow

### System Impact
- **Frontend**: Enhanced service layer, new video component, updated state management
- **API Dependencies**: Added calls to Habit OPD Teleconsultation service
- **WebRTC Integration**: New Agora SDK integration with token-based authentication
- **Payment Processing**: Enhanced payment workflow with wallet integration

### User Experience Impact
- **Real-time functionality**: Doctors, availability, and pricing updated in real-time
- **Complete journey**: From initial search to post-consultation prescription access
- **Professional presentation**: Video consultations with video/audio switching
- **Enhanced usability**: Smart form validation and loading states

### Technical Impact
- **New Dependencies**: `agora-rtc-sdk-ng` and updated RxJS versions
- **Service Layer**: New comprehensive service implementations
- **Component Architecture**: Separation of concerns with dedicated services
- **Error Handling**: Enhanced error states and user feedback

### Project Timeline Impact
- **Phase 1**: Core API integration (2-3 sprints) - Priority: P0 Critical
- **Phase 2**: Video calling integration (1-2 sprints) - Priority: P1 Important  
- **Phase 3**: Payment and prescription integration (1 sprint) - Priority: P1 Important
- **Phase 4**: QA and documentation (0.5 sprint) - Priority: P2 Moderate

**Critical Success Factors**:
- API integration reliability
- Video call quality and stability
- Payment workflow robustness
- User experience smoothness

**Dependencies**:
- Habit OPD Teleconsultation service availability
- Agora developer account credentials
- Backend service_request_id mapping for video checkin
- Third-party service integration readiness