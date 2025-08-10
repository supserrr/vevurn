# MANUAL RENDER CONFIGURATION

## If YAML files keep failing, configure manually in Render Dashboard:

### Create New Web Service:
1. **Repository**: supserrr/vevurn
2. **Branch**: main
3. **Root Directory**: `backend` (IMPORTANT!)
4. **Environment**: Node (NOT Docker!)
5. **Region**: Oregon (or preferred)

### Build & Deploy Settings:
**Build Command:**
```bash
echo "=== Backend Build ===" && corepack enable && corepack prepare pnpm@9.14.4 --activate && cd .. && pnpm install --no-frozen-lockfile && pnpm --filter @vevurn/backend build
```

**Start Command:**
```bash
pnpm start
```

### Environment Variables:
- `NODE_ENV=production`
- `PORT=3001`
- `FORCE_NODE_JS=true`
- `NO_DOCKER=true`

### CRITICAL: Make Sure
- ✅ Environment is set to "Node" 
- ✅ Root Directory is set to "backend"
- ❌ NO Docker settings enabled
- ❌ NO Dockerfile detection

## Alternative: Use render-nodejs-only.yaml

If manual configuration doesn't work, use the `render-nodejs-only.yaml` file which has extensive logging and error handling.
