# Development Scripts

This directory contains various development, debugging, and testing scripts used during development.

## Shell Scripts

- **cleanup-models.sh** - Clean up downloaded model files
- **debug-cli.sh** - Debug the CLI in development mode
- **deploy-granite.sh** - Deploy Granite model for testing
- **diagnose-terminal.sh** - Diagnose terminal configuration issues
- **run-debug.sh** - Run CLI with debug logging enabled
- **run-with-logging.sh** - Run CLI with verbose logging
- **update-config.sh** - Update configuration files

## Test Scripts

- **debug-test.js** - Debug test runner
- **test-colors.mjs** - Test terminal color output
- **test-copilotkit.sh** - Test CopilotKit integration
- **test-joomla.sh** - Test Joomla documentation generation
- **test-migration.js** - Test migration scripts

## Usage

Most scripts should be run from the repository root:

```bash
./docs/scripts/debug-cli.sh
```

Some scripts may require environment variables or configuration to be set first. Check individual script contents for requirements.
