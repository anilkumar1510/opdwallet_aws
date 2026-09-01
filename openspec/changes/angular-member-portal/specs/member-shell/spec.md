## ADDED Requirements

### Requirement: Single responsive layout
The portal SHALL serve mobile and desktop from one set of routes and one layout that adapts at breakpoints.

Rule: There is no mobile-only route tree, no device-sniffing redirect, and no separate mobile build. The same URL renders the same screen at every viewport width; only layout, navigation affordance, and density change.

#### Scenario: Same URL across viewports
- **GIVEN** a member opens a member route on a narrow viewport
- **WHEN** the same URL is opened on a wide viewport
- **THEN** the same screen and the same content are presented
- **AND** no redirect to a different URL occurs

#### Scenario: Resizing across the breakpoint
- **GIVEN** a member is viewing a member screen on a wide viewport
- **WHEN** the viewport narrows past the layout breakpoint
- **THEN** the layout switches to the narrow-viewport presentation
- **AND** the member stays on the same route
- **AND** any data already loaded on the screen is still displayed

### Requirement: Adaptive primary navigation
The portal SHALL present the same primary destinations at every viewport width, using a persistent side navigation on wide viewports and a bottom tab bar with a header on narrow viewports.

#### Scenario: Wide viewport navigation
- **GIVEN** a member is authenticated on a wide viewport
- **WHEN** any member screen is displayed
- **THEN** a persistent side navigation lists the primary destinations
- **AND** the destination matching the current route is indicated as active

#### Scenario: Narrow viewport navigation
- **GIVEN** a member is authenticated on a narrow viewport
- **WHEN** any member screen is displayed
- **THEN** a bottom tab bar exposes the primary destinations
- **AND** a header shows the current context and account access
- **AND** the destination matching the current route is indicated as active

#### Scenario: Destination parity
- **GIVEN** the primary destinations available on a wide viewport
- **WHEN** the same member views the portal on a narrow viewport
- **THEN** every one of those destinations is reachable
- **AND** no destination is available on only one viewport width

### Requirement: Navigation reflects the active member
The portal SHALL show, in the shell, which family member the portal is currently acting for whenever more than one family member is available.

#### Scenario: Active member shown in the shell
- **GIVEN** a member has at least one dependent
- **WHEN** any member screen is displayed
- **THEN** the shell identifies the family member currently being viewed

#### Scenario: Single member
- **GIVEN** a member has no dependents
- **WHEN** any member screen is displayed
- **THEN** no family-member selector is offered

### Requirement: Screen loading and error presentation
The portal SHALL present a loading state while a screen's data is pending, and a retryable error state when that data cannot be loaded, without leaving the member on a blank screen.

Rule: A failed data load never presents fabricated, stale, or placeholder values as if they were current.

#### Scenario: Data pending
- **GIVEN** a member navigates to a member screen
- **WHEN** the screen's data has not yet loaded
- **THEN** a loading state is presented in place of the screen's content
- **AND** the shell navigation remains usable

#### Scenario: Data load fails
- **GIVEN** a member navigates to a member screen
- **WHEN** the screen's data cannot be loaded
- **THEN** an error state explains that the data could not be loaded
- **AND** a retry action is offered
- **AND** no fabricated or placeholder values are shown in place of the data

#### Scenario: Retry succeeds
- **GIVEN** a member is viewing a screen's error state
- **WHEN** they retry and the data loads
- **THEN** the screen's content replaces the error state

### Requirement: Unknown route handling
The portal SHALL present a not-found screen for any member route that does not exist, rather than a blank screen or an error.

#### Scenario: Unknown member route
- **GIVEN** a member is authenticated
- **WHEN** they open a member URL that matches no screen
- **THEN** a not-found screen is presented within the member shell
- **AND** navigation back to the member home screen is offered
