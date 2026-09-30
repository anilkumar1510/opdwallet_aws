# Spec Delta

## Purpose

Lets a pharmacy member submit a prescription for digitisation, choose or add a delivery address, and send a pharmacy booking request that carries both the uploaded document and the chosen address.

## ADDED Requirements

### Requirement: Prescription selection uploads the file and retains its identifier
When a member selects a prescription file in the "Upload a new prescription" container, the system SHALL upload that file to the document-management service and SHALL retain the identifier returned by that service for use in the booking request. The system SHALL NOT advance the pharmacy flow on the basis of a file name alone.

#### Scenario: Selected file is uploaded and identified
- **WHEN** a member selects a prescription file for upload
- **THEN** the file is sent to the document-management upload endpoint as multipart form data
- **AND** the system retains the document identifier returned in the upload response
- **AND** the pharmacy flow does not advance until the upload has completed

#### Scenario: Upload failure blocks progression
- **WHEN** the upload request fails or returns no document identifier
- **THEN** the system surfaces a visible error to the member
- **AND** the pharmacy flow does not advance
- **AND** no booking request is sent

#### Scenario: Upload completion is visible while in flight
- **WHEN** an upload is in progress
- **THEN** the upload container communicates that an upload is in progress
- **AND** the submit control cannot be activated until the upload settles

#### Scenario: Upload response is tolerated across shapes
- **WHEN** the upload response returns the document as a single object rather than a list
- **THEN** the system still extracts the document identifier
- **AND** a response containing no identifier is treated as a failure

### Requirement: Saved delivery addresses are loaded and offered as selectable cards
The system SHALL load the active patient's saved delivery addresses from the address service and SHALL present them as horizontally scrolling cards, of which exactly one MAY be selected at a time. The system SHALL allow the member to change the selection, and SHALL NOT pre-select an address on the member's behalf.

#### Scenario: Addresses load for the active patient
- **WHEN** the prescription step is presented
- **THEN** the system requests the saved addresses filtered by the active patient's identifier
- **AND** each returned address is rendered as a card showing its readable address lines

#### Scenario: Member selects an address
- **WHEN** the member selects an address card
- **THEN** that card is marked as selected
- **AND** any previously selected card is no longer marked as selected

#### Scenario: Address load failure leaves the flow usable
- **WHEN** the address request fails
- **THEN** the system surfaces a visible error
- **AND** the member can still add a new address

#### Scenario: No saved addresses exist
- **WHEN** the address request returns no addresses
- **THEN** the system presents an explicit empty state inviting the member to add one
- **AND** the add-address card remains available

### Requirement: A new delivery address can be added through a reactive form modal
The system SHALL provide an add-address card alongside the saved address cards which, when activated, SHALL open a modal containing a reactive form with fields for `street1`, `street2`, `street3`, `city`, `state`, `pincode`, and `country`. On successful submission the system SHALL persist the address through the address service and SHALL make the new address available as a selectable card.

#### Scenario: Add-address card opens the form modal
- **WHEN** the member activates the add-address card
- **THEN** a modal containing the address form is presented
- **AND** the form exposes fields for street1, street2, street3, city, state, pincode, and country

#### Scenario: Valid address is saved and becomes selectable
- **WHEN** the member submits a valid address form
- **THEN** the address is sent to the address service
- **AND** the newly created address appears in the address cards
- **AND** the modal closes

#### Scenario: Street fields are encrypted before transmission
- **WHEN** a new address is submitted
- **THEN** the street fields are transmitted in encrypted form rather than as the plaintext the member typed
- **AND** the remaining address fields are transmitted as entered

#### Scenario: Address is not sent when encryption is unavailable
- **WHEN** the member submits a new address but no encryption key is available
- **THEN** the modal displays a visible error
- **AND** no address is sent to the address service in plaintext

#### Scenario: Invalid address is not sent
- **WHEN** the member submits the form with required fields missing or a pincode that is not valid
- **THEN** the form displays a field-level validation message
- **AND** no request is sent to the address service

#### Scenario: Address save failure is surfaced
- **WHEN** the address save request fails
- **THEN** the modal displays a visible error
- **AND** the modal remains open with the member's input preserved

#### Scenario: Modal can be dismissed
- **WHEN** the member dismisses the modal without submitting
- **THEN** the modal closes
- **AND** no address is created

### Requirement: Submitting a prescription sends a pharmacy booking request
When the member activates "Submit prescription" with a prescription document and a selected delivery address, the system SHALL send a pharmacy booking request carrying the uploaded document identifier, the policy identifier, and the selected address. The system SHALL NOT send the request when either the upload or the address selection is missing.

#### Scenario: Booking is sent with document and address
- **WHEN** the member activates "Submit prescription" with a completed upload and a selected address
- **THEN** a pharmacy booking request is sent carrying the uploaded document identifier, the policy identifier, and the selected address object
- **AND** the address object carries its type, street lines, city, state, pincode, and country with readable display names for city, state, and country

#### Scenario: Submission is blocked without an address
- **WHEN** the member activates "Submit prescription" with an uploaded prescription but no selected address
- **THEN** the system surfaces a validation message asking for a delivery address
- **AND** no booking request is sent

#### Scenario: Submission is blocked without an uploaded prescription
- **WHEN** the member activates "Submit prescription" with a selected address but no uploaded prescription
- **THEN** the system surfaces a validation message asking for a prescription
- **AND** no booking request is sent

#### Scenario: Booking failure is surfaced and does not advance the flow
- **WHEN** the booking request fails
- **THEN** the system surfaces a visible error
- **AND** the member remains on the prescription step with the uploaded prescription and selected address intact

#### Scenario: Policy identifier follows the member being prescribed for
- **WHEN** a booking is sent for a member other than the primary member
- **THEN** the policy identifier sent belongs to that member rather than the primary member's policy

#### Scenario: Missing policy blocks submission
- **WHEN** no policy resolves for the member being prescribed for
- **THEN** the system surfaces a validation message
- **AND** no booking request is sent with an empty or fabricated policy identifier

### Requirement: Encrypted address fields are readable on the address cards
When the address service returns `street1` or `street2` as encrypted values, the system SHALL render them in readable form on the address cards, and SHALL fall back to the value as received when it cannot be decrypted.

#### Scenario: Encrypted street values are displayed readably
- **WHEN** an address card renders an address whose street fields are returned encrypted
- **THEN** the card displays the decrypted street text

#### Scenario: Undecryptable value falls back to the raw value
- **WHEN** a street field cannot be decrypted, for example because no encryption key is available
- **THEN** the card displays the value as received rather than an empty or error state
