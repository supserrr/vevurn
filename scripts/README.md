# Scripts Directory

This directory contains various utility scripts for development, testing, and setup of the Vevurn POS system.

## Development Scripts

### `setup.sh`
Initial setup script for the development environment.

### `test-integration.sh` 
Integration testing script for the entire system.

### `test-system.sh`
Comprehensive system test that checks all API endpoints and frontend pages.

## Database & Authentication Scripts

### `create-better-auth-user.js`
Creates a test user for Better Auth authentication system.
Usage: `node scripts/create-better-auth-user.js`

## Testing Scripts

### `test-auth.js`
Tests authentication endpoints and functionality.
Usage: `node scripts/test-auth.js`

### `test-server.js`
Mock API server for frontend development when the main backend is not available.
Usage: `node scripts/test-server.js`

## Usage

All scripts should be run from the project root directory:

```bash
# From the project root (/Users/password/vevurn)
cd /Users/password/vevurn

# Run any script
node scripts/create-better-auth-user.js
bash scripts/setup.sh
bash scripts/test-system.sh
```

## Notes

- Ensure you have the required dependencies installed before running scripts
- Some scripts require environment variables to be properly configured
- The test-server.js provides mock data for development purposes only
