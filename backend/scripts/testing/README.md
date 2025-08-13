# Backend Testing Scripts

This directory contains various scripts for testing and diagnosing the backend server.

## Scripts

### `quick-test.sh`
**Purpose:** Quick endpoint availability testing
**Usage:** `./quick-test.sh`
- Tests all major API endpoints for basic connectivity
- Shows simple pass/fail status for each endpoint
- Requires backend server to be running

### `backend-test.mjs`
**Purpose:** Comprehensive API testing with detailed responses
**Usage:** `node backend-test.mjs`
- Tests all endpoints with sample data
- Shows full JSON responses
- Tests both GET and POST endpoints
- Includes performance timing

### `test-backend-diagnostics.mjs`
**Purpose:** Advanced diagnostic and troubleshooting
**Usage:** `node test-backend-diagnostics.mjs`
- Tests both local and production endpoints
- Environment variable validation
- Better Auth status checks
- Detailed error reporting

## Prerequisites

Before running these scripts, ensure:

1. **Backend Server Running:**
   ```bash
   cd /Users/password/vevurn
   pnpm run --filter=@vevurn/backend dev
   ```

2. **Dependencies Installed:**
   ```bash
   pnpm install
   ```

## Testing Workflow

1. **Quick Check:** `./quick-test.sh` - Verify all endpoints are responding
2. **Detailed Testing:** `node backend-test.mjs` - Test functionality with data
3. **Troubleshooting:** `node test-backend-diagnostics.mjs` - Diagnose issues

## Expected Results

When all tests pass, you should see:
- ✅ All endpoints returning 200 status codes
- ✅ JSON responses with expected structure
- ✅ Better Auth endpoints responding correctly
- ✅ Health check endpoints showing server status

## Troubleshooting

If tests fail:
1. Verify backend server is running on http://localhost:8001
2. Check environment variables are properly set
3. Ensure database connection is working
4. Review server logs for errors
