# RENDER DEPLOYMENT CONFIGURATION

⚠️ **CRITICAL: This project MUST use Node.js runtime, NOT Docker!**

## Render Configuration Required:

1. **Environment**: Node
2. **Runtime**: Node  
3. **Build Command**: `pnpm install --no-frozen-lockfile && pnpm --filter @vevurn/backend build`
4. **Start Command**: `cd backend && pnpm start`
5. **Auto-Deploy**: OFF (no Dockerfile)

## Do NOT use Docker!

This project is configured for Node.js runtime only. Any Docker configuration will fail.

Files that prevent Docker usage:
- No Dockerfile (deleted)
- .dockerignore blocks all files  
- render.yaml specifies `runtime: node`

If Docker is still being used, manually configure in Render Dashboard:
- Set Environment to "Node"
- Disable any Docker settings
- Use the build/start commands above
