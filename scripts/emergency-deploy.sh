#!/bin/bash
# Emergency deployment script - forces git commit and push

echo "🚨 EMERGENCY DEPLOYMENT - FORCING COMMIT"
echo "Timestamp: $(date)"

# Stage all changes
git add -A

# Commit with timestamp
git commit -m "EMERGENCY: Deploy bulletproof JavaScript server

- Replace TypeScript server.ts with pure JavaScript server.js  
- No TypeScript compilation needed - just copy .js file
- Updated package.json build script to copy server.js to dist/
- Removed all TypeScript dependencies from build process
- Pure Node.js HTTP server with no external dependencies

Timestamp: $(date)
Commit triggered by: Emergency deployment script"

# Force push
git push origin main --force

echo "✅ Emergency deployment committed and pushed"
