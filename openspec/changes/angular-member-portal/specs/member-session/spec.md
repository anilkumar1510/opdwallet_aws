## ADDED Requirements

### Requirement: Member authentication
The portal SHALL authenticate a member against the existing API and establish a session before granting access to any member area.

Rule: Authentication state is derived from the API alone. The portal MUST NOT substitute placeholder or mock identity when the API is unreachable.

#### Scenario: Successful login
- **GIVEN** an unauthenticated visitor is on the login screen
- **WHEN** they submit credentials the API accepts
- **THEN** a session is established
- **AND** they are taken to the member home screen

#### Scenario: Rejected credentials
- **GIVEN** an unauthenticated visitor is on the login screen
- **WHEN** they submit credentials the API rejects
- **THEN** they remain on the login screen
- **AND** an error message explains the credentials were not accepted
- **AND** no session is established

#### Scenario: Authentication service unreachable
- **GIVEN** an unauthenticated visitor is on the login screen
- **AND** the API cannot be reached
- **WHEN** they submit credentials
- **THEN** they remain on the login screen
- **AND** an error message states the service is unavailable
- **AND** no session is established
- **BUT** no placeholder identity is presented as a signed-in member

### Requirement: Session restoration
The portal SHALL restore an existing session on page load so an authenticated member is not asked to sign in again while their session is valid.

#### Scenario: Reload with a valid session
- **GIVEN** a member is authenticated
- **WHEN** they reload the portal on any member route
- **THEN** they remain on that route
- **AND** their identity is available to the screen without a further sign-in

#### Scenario: Reload with an expired session
- **GIVEN** a member's session has expired
- **WHEN** they reload the portal on a member route
- **THEN** they are taken to the login screen
- **AND** the route they attempted is remembered

#### Scenario: Return to the attempted route after signing in again
- **GIVEN** a member was redirected to login from a remembered member route
- **WHEN** they authenticate successfully
- **THEN** they are taken to that remembered route rather than the member home screen

### Requirement: Member route protection
The portal SHALL deny access to every member route to a visitor without a valid session.

#### Scenario: Direct navigation without a session
- **GIVEN** a visitor has no session
- **WHEN** they open a member route directly by URL
- **THEN** they are taken to the login screen
- **AND** no member data is displayed at any point

#### Scenario: Login screen while already authenticated
- **GIVEN** a member is authenticated
- **WHEN** they open the login screen
- **THEN** they are taken to the member home screen

### Requirement: Session termination
The portal SHALL end the session and discard all cached member data when the member signs out or the API reports the session is no longer valid.

Rule: Session termination is handled in one place. Any API response indicating an invalid session MUST produce the same outcome regardless of which screen triggered the request.

#### Scenario: Explicit sign out
- **GIVEN** a member is authenticated
- **WHEN** they sign out
- **THEN** the session ends
- **AND** they are taken to the login screen
- **AND** no previously loaded member data remains available to any screen

#### Scenario: Session rejected mid-session
- **GIVEN** a member is authenticated and viewing a member screen
- **WHEN** any request to the API reports the session is no longer valid
- **THEN** the session ends
- **AND** they are taken to the login screen
- **AND** no previously loaded member data remains available to any screen

#### Scenario: Signing back in after signing out
- **GIVEN** a member signed out and a different member signs in on the same device
- **WHEN** the member home screen loads
- **THEN** only the newly signed-in member's data is displayed
