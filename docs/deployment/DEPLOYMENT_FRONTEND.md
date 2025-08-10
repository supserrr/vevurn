# Vevurn Frontend Deployment

## Render Deployment Configuration

### Service Settings:
- **Name**: vevurn-frontend
- **Runtime**: Node.js
- **Root Directory**: `./frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node .next/standalone/frontend/server.js`

### Environment Variables:
```
NODE_ENV=production
PORT=10000
NEXT_PUBLIC_API_URL=https://vevurn-backend.onrender.com
```

### Build Output:
- Uses Next.js `output: 'standalone'` mode
- Creates optimized production build in `.next/standalone/`
- Server runs on `server.js` in standalone directory

### Local Development:
```bash
npm install
npm run dev
```

### Production Build Test:
```bash
npm run build
npm run start
```
