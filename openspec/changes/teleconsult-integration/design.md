# Design: Teleconsultation API Integration

## Context

The current `OnlineConsultPage` (located at `projects/member/src/app/features/online-consult/online-consult-page.ts`) is a **static, single-component wizard**. It uses 470 lines of hardcoded TypeScript constants (`SPECIALITIES`, `DOCTORS`, `PATIENTS`, etc.) for all its data and contains the entire UI inside a 300-line inline Angular template (`imports: []`).

The component is already wired into the app's root route configuration at `/member/online-consult`. The team has provided a complete contract of backend APIs from the `habit-opd` service (Teleconsultation) and a production-grade Agora implementation from a reference project.

**Constraints**:
- Must remain an Angular application (using Angular v17+ features: Signals, `computed`, and `@if` syntax).
- Must use a service-oriented architecture to manage state and API calls.
- The component must not directly import Agora; the call functionality must be isolated in a dedicated service and component.
- The workflow requires real, authenticated data, unlike the current mock environment.

## Goals / Non-Goals

**Goals:**
- Replace all hardcoded data constants with asynchronous API calls.
- Create a dedicated `OnlineConsultService` to encapsulate API integration and business logic.
- Implement a new `AgoraVideoComponent` to isolate WebRTC logic and handle the real-time call experience.
- Refactor the main `OnlineConsultPage` to consume the new services and delegate view logic to the Agora component when needed.

**Non-Goals:**
- Modifying the existing authentication or session state management outside of consuming the `GET_FAMILY_LIST` API.
- Creating new global UI components or changing the core application shell layout; this change is scoped strictly within the `online-consult` feature folder.
- Setting up the Agora App ID or backend token endpoint; these are infrastructure concerns (handled by the ops/backend team).
- Building a fully responsive, cross-browser tested video call UI beyond the integration surface defined in the reference implementation.

## Decisions

1.  **Service-Oriented Architecture**: A dedicated `OnlineConsultService` will handle all HTTP requests to the `habit-opd` API. This centralizes the logic for building query params, base64-encoding the `resource` payload for `cart_add`/`checkout`/`book_appointment`, and parsing the `resource` wrapper array from responses.
2.  **Reactive State Management**: The refactored `OnlineConsultPage` will use Angular Signals (`signal`) to reactively bind API responses to the template. This aligns with the Angular v17+ idioms already present in the static version of the component.
3.  **Dedicated Agora Module**: The video call functionality will be implemented in a new `AgoraVideoComponent` and `AgoraService`. This cleanly separates concerns, making the video call reusable and testable independently of the booking logic. The `AgoraService` will wrap the `agora-rtc-sdk-ng` client, exposing an Observable-based API for connection state, remote users, and network stats.
4.  **API Payload Handling**: Since endpoints like `cart_add` require a `base64`-encoded `resource` string, we will create a utility function within the `OnlineConsultService` to handle this serialization and encoding, preventing duplication and ensuring correctness.

## Risks / Trade-offs

- **Risk**: The `base64`-encoded payloads for `cart_add` and `checkout` are complex and prone to errors if the structure doesn't match the backend's expectations.
  - **Mitigation**: We will create detailed TypeScript types for the `CartSnapshot` and `CheckoutSnapshot` based on the API examples provided. This will give us compile-time safety over the objects we encode.
- **Risk**: The Agora integration is a third-party dependency that may have browser compatibility or CORS issues.
  - **Mitigation**: We will strictly follow the provided Agora specification, which includes a comprehensive verification checklist to test cross-browser behavior and connection stability.
- **Trade-off**: Replacing the single-file component with multiple services and a dedicated component increases the number of files but significantly improves testability and maintainability.

## Migration Plan

1.  **Code**: Implement the `OnlineConsultService`, `AgoraService`, and `AgoraVideoComponent`.
2.  **Refactor**: Update the `OnlineConsultPage` to inject `OnlineConsultService` and `AgoraService`, replacing the static constants with reactive signals populated by the service.
3.  **Integrate UI**: Replace the static "In call" placeholder `<div>` in `OnlineConsultPage` with a `<app-agora-video>` selector for the `consultation` step.
4.  **Test**: Run `npm run build` and `npm test` to ensure all changes are sound.
5.  **Review**: Conduct a self-review on the final diff to ensure the implementation matches this design.

## Open Questions

- We need confirmation on the exact Agora App ID and whether the backend `/api/agora/token` endpoint is already provisioned and accessible. If not, we must scope the backend token generation as a follow-up task.
- We need to confirm the API endpoint for the "Empanelment Request" form submission (Step 17 of the requirement) is available, or if it should be a future phase.