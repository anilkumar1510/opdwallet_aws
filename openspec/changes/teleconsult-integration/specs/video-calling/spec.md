# Online Consultation Video Calling Specification

## Purpose

Enables real-time video and audio consultations between patients and doctors using Agora RTC SDK with dynamic token provisioning, credentials management, network quality monitoring, and full call lifecycle management.

## ADDED Requirements

### Requirement: Initialize Video Call Session
The system SHALL initialize a video/audio call session using the `video_checkin` API, Agora credentials endpoint, Agora token endpoint, and Agora RTC SDK.

#### Scenario: Successful Video Call initialization
- **WHEN** user clicks "Join consultation" or "Join call" on a confirmed booking with mode "Video"
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=video_checkin` with `{ "service_request_id": serviceRequestId, "tag_data": [] }`
- **AND** system queries `GET /habit-opd/api/v1/opd_tele_booking?queryId=TELE_AGORA_CREDENTIALS&args=key:agora_app_id` to get `agora_app_id`
- **AND** system queries `GET /habit-opd/api/v1/opd_tele_booking?queryId=TELE_AGORA_TOKEN&args=channelName:<serviceRequestId>` to get `channel_id` and `token_id`
- **AND** system initializes Agora RTC client with App ID, `channel_id`, `token_id`, and `null` UID (server assigned)
- **AND** system creates and publishes local microphone and camera tracks
- **AND** system renders local video in local player container
- **AND** system subscribes to remote doctor audio/video tracks upon `user-published`

#### Scenario: Successful Audio Call initialization
- **WHEN** user clicks "Join consultation" on a confirmed booking with mode "Audio"
- **THEN** system executes check-in, credentials fetch, and token fetch as above
- **AND** system creates and publishes microphone audio track ONLY
- **AND** camera track is disabled and local video tile is hidden
- **AND** UI presents an audio consultation interface displaying doctor avatar, name, and audio activity indicator

#### Scenario: Call initialization failure
- **WHEN** `video_checkin`, credentials fetch, or token fetch fails
- **THEN** system displays a user-friendly error message with a "Retry" button

### Requirement: Network Quality Monitoring
The system SHALL display real-time network quality metrics during the call.

#### Scenario: Good network quality
- **WHEN** Agora reports downlink network quality 1-3
- **THEN** system displays "Good" quality indicator with green badge

#### Scenario: Poor network quality
- **WHEN** Agora reports downlink network quality 4-6
- **THEN** system displays "Bad" quality indicator with red badge

#### Scenario: Network metrics display
- **WHEN** call is active
- **THEN** system displays bandwidth (Kbps), call duration, and quality status in real-time

### Requirement: Call Controls
The system SHALL provide intuitive in-call controls.

#### Scenario: Toggle microphone
- **WHEN** user clicks mute/unmute button
- **THEN** system toggles local audio track enabled state and updates button state

#### Scenario: Toggle camera (Video Call only)
- **WHEN** user clicks camera on/off button in video mode
- **THEN** system toggles local video track enabled state and updates button state

#### Scenario: End call
- **WHEN** user clicks leave call button
- **THEN** system calls Agora `leaveChannel()`
- **AND** system stops and closes all local audio/video tracks
- **AND** system emits `callEnded` event to transition to post-consultation step (e.g. digital prescription)

### Requirement: Token Renewal
The system SHALL handle Agora token expiration dynamically without interrupting active calls.

#### Scenario: Token about to expire
- **WHEN** Agora fires `token-privilege-will-expire` event (30 seconds before expiration)
- **THEN** system queries `TELE_AGORA_TOKEN` with `serviceRequestId` for a fresh `token_id`
- **AND** system invokes `client.renewToken(newToken)`
- **AND** call continues uninterrupted

### Requirement: Consultation Room Deep-Linking
The system SHALL allow members to join teleconsultations directly from `/member/consultations/:appointmentId`.

#### Scenario: Direct join from bookings or URL
- **WHEN** member opens `/member/consultations/:appointmentId`
- **THEN** the consultation room uses the Agora video/audio engine with `serviceRequestId = appointmentId`
- **AND** performs check-in, retrieves credentials/token, and connects to the consultation session

## Data Contracts

### 1. Video Checkin Request & Response
```http
POST /habit-opd/api/v1/opd_tele_booking
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
action=video_checkin
resource=base64({"service_request_id": "<serviceRequestId>", "tag_data": []})
```
```json
{
  "errCode": 0,
  "message": "Success",
  "resource": [
    {
      "id": "80c4c220-c614-11f1-af08-12e18e53fe2a-50",
      "service_request_id": "6cb6af30-c585-11f1-8655-ead29accafe9-38",
      "tag_data": []
    }
  ]
}
```

### 2. Agora Credentials Response (`TELE_AGORA_CREDENTIALS`)
```http
GET /habit-opd/api/v1/opd_tele_booking?queryId=TELE_AGORA_CREDENTIALS&args=key:agora_app_id&application=habit-opd
```
```json
{
  "errCode": 0,
  "message": "Success",
  "count": 1,
  "resource": [
    {
      "id": "de99c240-cbd4-11f1-809a-12e18e53fe2a-46",
      "data": {
        "key": "agora_app_id",
        "value": "e4e1a21b3c8b4488bc3c219e2491bed0",
        "description": "agora voip app id for kx"
      }
    }
  ]
}
```

### 3. Agora Token Response (`TELE_AGORA_TOKEN`)
```http
GET /habit-opd/api/v1/opd_tele_booking?queryId=TELE_AGORA_TOKEN&args=channelName:<serviceRequestId>&application=habit-opd
```
```json
{
  "errCode": 0,
  "message": "Success",
  "count": 1,
  "resource": [
    {
      "id": "1d2da800-cbd5-11f1-9f63-12e18e53fe2a-58",
      "data": {
        "channel_id": "f35dc8e0-cbcd-11f1-980d-1e6409e368f1-99",
        "token_id": "007eJxTYNh94qHNDx0pD5uolWKdN54V/DnD31m9XO/WrllvXvT+U5RQYEg1STVMNDJMMk62SDIxsbBISjZONjK0TDUysTRMSk0xqLe9lqUgw8AwU6e3m5GBkYEFiEF8JjDJDCZZwKQ6Q5qxaUqyRaqBbnJScoquoWGaoa6lhQGQlWpmYmCZamxmARKxZGAAAG6WKk4="
      }
    }
  ]
}
```

## Error Handling
- Credentials failure → Fall back to cached/default App ID, log warning
- Token fetch failure → Display "Unable to generate call token. Please retry."
- Permission denial (Mic/Camera) → Display clear instructions to allow browser permissions
- Network disconnection → Display "Reconnecting..." and automatically rejoin
