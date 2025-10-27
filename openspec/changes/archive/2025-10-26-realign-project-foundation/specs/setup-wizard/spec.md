## ADDED Requirements

### Requirement: Persistent API Key Storage
The setup wizard SHALL reliably store API keys in the system keychain on first attempt, with automatic fallback to encrypted file storage when keychain is unavailable.

#### Scenario: Successful keychain storage
- **GIVEN** a user completes the setup wizard with valid API keys
- **WHEN** the wizard saves configuration
- **THEN** API keys are stored in system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **AND** post-save validation confirms keys are retrievable
- **AND** subsequent wizard launches detect stored keys and skip prompts

#### Scenario: Keychain unavailable fallback
- **GIVEN** system keychain is not available or accessible
- **WHEN** the wizard attempts to save API keys
- **THEN** wizard automatically falls back to encrypted file storage (~/.legilimens/secrets.json)
- **AND** user is notified of fallback method
- **AND** file permissions are set to user-read-only (0600)
- **AND** subsequent wizard launches retrieve keys from encrypted file

#### Scenario: Storage validation failure
- **GIVEN** API keys are submitted for storage
- **WHEN** storage attempt fails for any reason
- **THEN** wizard displays clear error message with diagnostic information
- **AND** wizard offers retry option
- **AND** wizard offers option to save to encrypted file manually
- **AND** wizard does NOT mark setup as completed

### Requirement: Setup Completion Detection
The system SHALL accurately detect when setup is complete to prevent repeated wizard launches.

#### Scenario: First-time user
- **GIVEN** no previous configuration exists
- **WHEN** user launches Legilimens CLI
- **THEN** setup wizard launches automatically
- **AND** wizard detects missing required configuration (Tavily API key)
- **AND** wizard displays first-time setup welcome message

#### Scenario: Returning user with complete config
- **GIVEN** user has completed setup wizard previously
- **AND** required API keys are stored and retrievable
- **WHEN** user launches Legilimens CLI  
- **THEN** wizard is skipped
- **AND** CLI proceeds directly to welcome screen
- **AND** no repeated prompts for already-stored keys

#### Scenario: Partial configuration
- **GIVEN** user has partially completed setup (e.g., missing Tavily key)
- **WHEN** user launches Legilimens CLI
- **THEN** wizard launches and displays "Configuration incomplete" message
- **AND** wizard shows what configuration is present (e.g., "Found: Local LLM configured")
- **AND** wizard only prompts for missing items

### Requirement: Post-Save Validation
The wizard SHALL validate that saved configuration is immediately retrievable before marking setup as complete.

#### Scenario: Successful round-trip validation
- **GIVEN** wizard has saved API keys
- **WHEN** post-save validation executes
- **THEN** wizard retrieves each saved key from storage
- **AND** wizard confirms retrieved values match saved values (length check, not plaintext comparison)
- **AND** wizard marks setup as completed only after successful validation

#### Scenario: Validation failure detection
- **GIVEN** wizard has attempted to save API keys
- **WHEN** post-save validation cannot retrieve keys
- **THEN** wizard displays error: "Configuration saved but could not be verified. Please restart wizard."
- **AND** setup completion flag is NOT set
- **AND** wizard logs diagnostic information for troubleshooting

### Requirement: Diagnostic Logging
The wizard SHALL log detailed diagnostic information to aid troubleshooting of storage failures.

#### Scenario: Debug logging enabled
- **GIVEN** LEGILIMENS_DEBUG environment variable is true
- **WHEN** wizard encounters storage operation
- **THEN** wizard logs keychain detection results
- **AND** wizard logs storage method selected (keychain vs file)
- **AND** wizard logs success/failure of each storage operation
- **AND** wizard logs post-validation results
- **AND** logs are written to console (not file, for immediate visibility)

#### Scenario: Keychain detection diagnostics
- **GIVEN** wizard is checking for keychain availability
- **WHEN** keychain detection runs
- **THEN** wizard logs platform (macOS/Windows/Linux)
- **AND** wizard logs keychain service availability
- **AND** wizard logs any error messages from keychain library
- **AND** wizard logs fallback decision rationale
