# Online Consultation Video Calling Specification

## Purpose

Enables real-time video/audio consultations between patients and doctors using Agora RTC SDK with proper token management, network quality monitoring, and call lifecycle management.

## ADDED Requirements

### Requirement: Initialize Video Call Session
The system SHALL initialize a video/audio call session using the `video_checkin` API and Agora RTC SDK.

#### Scenario: Successful call initialization
- **WHEN** user clicks "Join consultation" on confirmed booking
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=video_checkin` with `service_request_id`
- **AND** system fetches Agora token from backend endpoint
- **AND** system initializes Agora RTC client with App ID, channel name, token, and UID
- **AND** system publishes local audio/video tracks
- **AND** system subscribes to remote user tracks

#### Scenario: Call initialization failure
- **WHEN** video_checkin API fails or token fetch fails
- **THEN** system displays error with retry option

### Requirement: Network Quality Monitoring
The system SHALL display real-time network quality metrics during the call.

#### Scenario: Good network quality
- **WHEN** Agora reports downlink network quality 1-3
- **THEN** system displays "Good" quality indicator with green indicator

#### Scenario: Poor network quality
- **WHEN** Agora reports downlink network quality 4-6
- **THEN** system displays "Bad" quality indicator with red indicator

#### Scenario: Network metrics display
- **WHEN** call is active
- **THEN** system displays bandwidth (Kbps), call duration, and quality status in real-time

### Requirement: Call Controls
The system SHALL provide call control functionality.

#### Scenario: Toggle microphone
- **WHEN** user clicks mute/unmute button
- **THEN** system toggles local audio track enabled state
- **AND** button visual state updates accordingly

#### Scenario: Toggle camera
- **WHEN** user clicks camera on/off button
- **THEN** system toggles local video track enabled state
- **AND** button visual state updates accordingly

#### Scenario: End call
- **WHEN** user clicks end call button
- **THEN** system calls Agora leaveChannel()
- **AND** system stops and closes all local tracks
- **AND** system emits callEnded event to parent component

### Requirement: Token Renewal
The system SHALL handle Agora token expiration.

#### Scenario: Token about to expire
- **WHEN** Agora fires token-privilege-will-expire event
- **THEN** system fetches new token from backend
- **AND** system calls client.renewToken(newToken)
- **AND** call continues without interruption

## Data Contracts

### Agora Token Response
```json
{
  "token": "007eJxTYLjj...",
  "channelName": "teleconsult-session-1",
  "uid": 12345,
  "expiresIn": 86400
}
```

### Network Stats
```typescript
interface NetworkStats {
  bandwidth: string;      // e.g., "150 Kbps"
  duration: string;       // e.g., "2m 30s"
  quality: 'Good' | 'Bad' | 'Unknown';
}
```

## Error Handling
- Token fetch failure → Display error, offer retry
- Channel join failure → Display error, offer retry
- Track creation failure → Display error, fallback to audio-only
- Network disconnection → Auto-reconnect attempt, show status