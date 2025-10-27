## MODIFIED Requirements

### Requirement: Local LLM JSON Extraction
The local LLM integration SHALL reliably extract JSON responses from phi-4 model output, achieving 90%+ success rate through robust parsing and retry logic.

#### Scenario: Pure JSON response
- **GIVEN** phi-4 model returns valid JSON only
- **WHEN** local LLM runner processes response
- **THEN** JSON is extracted successfully on first attempt
- **AND** no retry is needed
- **AND** parsed JSON contains required fields (shortDescription, features)

#### Scenario: JSON with prose wrapper
- **GIVEN** phi-4 model returns JSON wrapped in explanatory text
- **WHEN** local LLM runner processes response
- **THEN** JSON extraction regex identifies JSON object boundaries
- **AND** JSON is extracted from surrounding prose
- **AND** extracted JSON parses successfully
- **AND** operation completes without retry

#### Scenario: Invalid JSON with retry
- **GIVEN** phi-4 model returns invalid or incomplete JSON
- **WHEN** local LLM runner detects invalid JSON
- **THEN** runner logs warning about invalid JSON
- **AND** runner retries request once with same prompt
- **AND** if second attempt succeeds, JSON is extracted
- **AND** if second attempt fails, runner falls back to external CLI tools

#### Scenario: Prose-only response fallback
- **GIVEN** phi-4 model returns prose instead of JSON after retries
- **WHEN** local LLM runner exhausts retry attempts
- **THEN** runner logs error with response preview (first 500 chars)
- **AND** runner returns failure status with clear error message
- **AND** gateway.ts fallback logic triggers external CLI tool attempt
- **AND** user sees informative progress message about fallback

### Requirement: AI Generation Fallback Chain
The gateway SHALL implement a clear, deterministic fallback chain for AI generation with comprehensive error reporting at each stage.

#### Scenario: Local LLM success path
- **GIVEN** local LLM is enabled and configured
- **WHEN** AI generation starts
- **THEN** local LLM is attempted first
- **AND** if successful, external CLI tools are NOT attempted
- **AND** metadata indicates generation method: "local-llm"
- **AND** generation duration is recorded

#### Scenario: Local LLM to external CLI fallback
- **GIVEN** local LLM fails after retries
- **WHEN** fallback logic executes
- **THEN** external CLI tools are attempted in order (gemini, codex, claude, qwen)
- **AND** each tool failure is logged with specific error
- **AND** first successful tool result is used
- **AND** metadata indicates tool used and attempt count

#### Scenario: All AI engines unavailable
- **GIVEN** local LLM is disabled or failed
- **AND** no external CLI tools are detected
- **WHEN** AI generation attempts complete
- **THEN** fallback content generator is invoked
- **AND** metadata flag aiEnginesUnavailable is set to true
- **AND** metadata aiEnginesUnavailableReason explains why (e.g., "Local LLM disabled; no AI CLI tools detected")
- **AND** user sees clear message about using fallback content

#### Scenario: Fallback content generation
- **GIVEN** AI generation has failed completely
- **WHEN** fallback content generator runs
- **THEN** generator creates basic short description based on dependency type
- **AND** generator creates 5 generic but relevant feature bullets
- **AND** generated content is valid and template-compliant
- **AND** user is notified that AI generation failed but docs were created

### Requirement: JSON Extraction Robustness
The JSON extraction module SHALL handle multiple response formats from different LLM providers gracefully.

#### Scenario: Code block wrapped JSON
- **GIVEN** LLM returns JSON in markdown code block
- **WHEN** extraction processes response
- **THEN** extraction detects ```json or ``` code fence
- **AND** extraction extracts content between code fences
- **AND** extraction parses extracted content as JSON

#### Scenario: Multiple JSON objects in response
- **GIVEN** LLM returns multiple JSON objects in response
- **WHEN** extraction processes response
- **THEN** extraction identifies first valid JSON object
- **AND** extraction validates object has required fields
- **AND** extraction returns first valid object (ignores subsequent ones)

#### Scenario: Partial JSON with truncation
- **GIVEN** LLM response was truncated mid-JSON
- **WHEN** extraction attempts parsing
- **THEN** extraction detects invalid JSON structure
- **AND** extraction logs truncation detection
- **AND** extraction returns failure status
- **AND** caller triggers retry or fallback

### Requirement: Error Message Clarity
AI generation failures SHALL produce actionable error messages that help users understand and resolve issues.

#### Scenario: Local LLM binary not found
- **GIVEN** local LLM is enabled but binary path is invalid
- **WHEN** local LLM runner attempts execution
- **THEN** error message states: "Local LLM binary not found at [path]"
- **AND** error suggests running setup wizard to reconfigure
- **AND** error indicates fallback to external CLI tools

#### Scenario: Model file missing
- **GIVEN** local LLM binary exists but model file is missing
- **WHEN** local LLM runner attempts execution
- **THEN** error message states: "phi-4 model file not found at [path]"
- **AND** error suggests re-running setup wizard to download model
- **AND** error provides expected model file size (~8.5GB)

#### Scenario: Timeout during generation
- **GIVEN** local LLM or external CLI tool exceeds timeout
- **WHEN** timeout is detected
- **THEN** error message states: "AI generation timed out after [N]ms"
- **AND** error suggests using minimal mode for faster operations
- **AND** error indicates which engine timed out (local LLM vs specific CLI tool)
