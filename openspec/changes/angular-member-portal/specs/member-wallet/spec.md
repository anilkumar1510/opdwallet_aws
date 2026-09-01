## ADDED Requirements

### Requirement: Wallet balance presentation
The portal SHALL present the active family member's wallet as an allocated amount, an amount consumed, and a currently available balance, for the policy period in force.

Rule: The portal displays balances the API reports. It MUST NOT compute, adjust, or infer a balance from transactions on the client.

#### Scenario: Wallet displayed for the active member
- **GIVEN** the active family member has a wallet for the current policy period
- **WHEN** the wallet screen is displayed
- **THEN** the allocated amount, the consumed amount, and the available balance are presented
- **AND** the policy period the wallet applies to is identified

#### Scenario: Wallet follows the active member
- **GIVEN** a primary member is viewing their own wallet
- **WHEN** they switch the active family member to a dependent
- **THEN** the wallet screen presents that dependent's wallet

#### Scenario: No wallet for the active member
- **GIVEN** the active family member has no wallet for the current policy period
- **WHEN** the wallet screen is displayed
- **THEN** a message explains no wallet is available for this member
- **AND** no balance figures are shown

### Requirement: Benefit category balances
The portal SHALL present, for each benefit category in the active family member's wallet, a readable category name and the balance available in that category.

#### Scenario: Categories listed with readable names
- **GIVEN** the active family member's wallet has benefit categories
- **WHEN** the wallet screen is displayed
- **THEN** each category is listed with a readable name and its available balance
- **AND** no category code is presented to the member

#### Scenario: Unrecognised category
- **GIVEN** the wallet contains a category whose code the portal does not recognise
- **WHEN** the wallet screen is displayed
- **THEN** that category is still listed with its balance
- **AND** the name reported by the API is used as its label
- **AND** the screen does not fail to load

#### Scenario: Unlimited category
- **GIVEN** a benefit category is marked as unlimited
- **WHEN** the wallet screen is displayed
- **THEN** that category is presented as unlimited
- **AND** no numeric remaining balance is presented for it

#### Scenario: Exhausted category
- **GIVEN** a benefit category has no balance remaining
- **WHEN** the wallet screen is displayed
- **THEN** that category is presented as exhausted
- **AND** it remains visible in the list

### Requirement: Shared family wallet consumption
The portal SHALL indicate, when a wallet is shared across the family, how much of the shared balance each family member has consumed.

#### Scenario: Shared wallet
- **GIVEN** the wallet is shared across the family
- **WHEN** the wallet screen is displayed
- **THEN** the wallet is identified as shared across the family
- **AND** the amount consumed by each family member is presented

#### Scenario: Individual wallet
- **GIVEN** the wallet applies to the active family member alone
- **WHEN** the wallet screen is displayed
- **THEN** no per-family-member consumption breakdown is presented

### Requirement: Wallet transaction history
The portal SHALL present the active family member's wallet transactions in reverse chronological order, each showing its date, whether it added to or drew from the balance, its amount, and what it related to.

#### Scenario: Transactions listed
- **GIVEN** the active family member has wallet transactions
- **WHEN** the transaction history is displayed
- **THEN** transactions are listed newest first
- **AND** each shows its date, direction, amount, and the service or reason it relates to

#### Scenario: Loading further transactions
- **GIVEN** more transactions exist than are currently displayed
- **WHEN** the member requests more
- **THEN** the next set is appended to the list
- **AND** already-displayed transactions are not repeated

#### Scenario: No transactions
- **GIVEN** the active family member has no wallet transactions
- **WHEN** the transaction history is displayed
- **THEN** a message explains there is no activity yet

#### Scenario: Reversed transaction
- **GIVEN** a wallet transaction has been reversed
- **WHEN** the transaction history is displayed
- **THEN** that transaction is presented as reversed

### Requirement: Monetary and date presentation
The portal SHALL present every wallet amount as a formatted currency value and every wallet date in the member's local convention.

#### Scenario: Amounts formatted
- **GIVEN** the wallet screen or transaction history is displayed
- **WHEN** any monetary amount is presented
- **THEN** it is shown as a formatted currency value with its currency symbol
- **AND** no raw unformatted number is presented

#### Scenario: Dates formatted
- **GIVEN** the wallet screen or transaction history is displayed
- **WHEN** any date is presented
- **THEN** it is shown in a readable date format
- **AND** no raw timestamp string is presented
