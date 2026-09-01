## ADDED Requirements

### Requirement: Active family member selection
The portal SHALL maintain exactly one active family member at a time, and every screen SHALL present data for that member.

Rule: The active member is the single source of truth for whose data is shown. No screen may independently choose a different family member.

#### Scenario: Default active member
- **GIVEN** a member signs in
- **WHEN** the member home screen loads
- **THEN** the signed-in member is the active family member

#### Scenario: Switching the active member
- **GIVEN** a primary member with at least one dependent is viewing their own data
- **WHEN** they select a dependent as the active family member
- **THEN** the active family member becomes that dependent
- **AND** every screen subsequently presents that dependent's data

#### Scenario: Already-open screen follows the switch
- **GIVEN** a primary member is viewing a screen showing their own data
- **WHEN** they switch the active family member to a dependent
- **THEN** the screen they are on refreshes to that dependent's data without a manual reload

### Requirement: Eligibility to switch family member
The portal SHALL offer family-member switching only to a primary member who has at least one dependent.

#### Scenario: Primary member with dependents
- **GIVEN** a signed-in member is the primary member
- **AND** they have at least one dependent
- **WHEN** any member screen is displayed
- **THEN** a family-member selector is offered
- **AND** it lists the primary member and every dependent

#### Scenario: Primary member with no dependents
- **GIVEN** a signed-in member is the primary member
- **AND** they have no dependents
- **WHEN** any member screen is displayed
- **THEN** no family-member selector is offered

#### Scenario: Dependent signs in directly
- **GIVEN** a signed-in member is a dependent rather than the primary member
- **WHEN** any member screen is displayed
- **THEN** no family-member selector is offered
- **AND** only their own data is presented

### Requirement: Active member persists for the session
The portal SHALL keep the active family member across reloads and navigation within a session, and SHALL reset it when the session ends.

#### Scenario: Reload keeps the selection
- **GIVEN** a primary member has selected a dependent as the active family member
- **WHEN** they reload the portal
- **THEN** that dependent is still the active family member

#### Scenario: Selection does not survive sign out
- **GIVEN** a primary member has selected a dependent as the active family member
- **WHEN** they sign out and sign in again
- **THEN** the signed-in member is the active family member

#### Scenario: Stored selection no longer valid
- **GIVEN** a dependent was the active family member in a previous page load
- **AND** that dependent is no longer part of the family
- **WHEN** the portal loads
- **THEN** the signed-in member becomes the active family member
- **AND** no error is presented to the member

### Requirement: Family membership presentation
The portal SHALL present each family member with a display name and a human-readable relationship, never a raw relationship code.

#### Scenario: Known relationship
- **GIVEN** the API reports a dependent with a recognised relationship
- **WHEN** the family-member selector is displayed
- **THEN** that dependent is listed with their name and the relationship in readable words

#### Scenario: Unrecognised relationship
- **GIVEN** the API reports a dependent whose relationship value is not recognised by the portal
- **WHEN** the family-member selector is displayed
- **THEN** that dependent is still listed and selectable
- **AND** a neutral relationship label is shown in place of the unrecognised value
- **AND** the raw value is not shown to the member

### Requirement: Family data unavailable
The portal SHALL keep the signed-in member's own screens usable when family membership cannot be loaded.

#### Scenario: Family load fails
- **GIVEN** a member is authenticated
- **WHEN** family membership cannot be loaded
- **THEN** the signed-in member is the active family member
- **AND** no family-member selector is offered
- **AND** the member can continue to use their own screens
