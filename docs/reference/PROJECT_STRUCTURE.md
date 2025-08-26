# Vevurn POS - Project Structure

## Root Directory Organization

### Configuration Files
- `.env` - Environment variables
- `.env.example` - Environment template
- `.eslintrc.js` - ESLint configuration
- `.gitignore` - Git ignore rules
- `.nvmrc` - Node version specification
- `package.json` - Root package configuration
- `pnpm-lock.yaml` - Package lock file
- `prettier.config.js` - Code formatting config
- `tsconfig.json` - TypeScript configuration

### Project Directories
- `backend/` - Express.js API server and database
- `frontend/` - Next.js web application
- `shared/` - Shared types and utilities
- `docs/` - Project documentation
- `scripts/` - Development and testing scripts

### Documentation
- `README.md` - Main project documentation
- `SYSTEM_COMPLETION_REPORT.md` - Completion status report

## Directory Details

### Backend (`/backend`)
```
backend/
├── src/                 # Source code
│   ├── controllers/     # API controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── config/          # Configuration
│   └── utils/           # Utilities
├── prisma/              # Database schema and migrations
├── tests/               # Backend tests
└── package.json         # Backend dependencies
```

### Frontend (`/frontend`)
```
frontend/
├── apps/web/            # Next.js application
│   ├── app/             # App router pages
│   ├── components/      # React components
│   └── public/          # Static assets
├── packages/            # Shared packages
└── package.json         # Frontend dependencies
```

### Scripts (`/scripts`)
```
scripts/
├── setup.sh                    # Environment setup
├── test-system.sh              # System tests
├── test-integration.sh         # Integration tests
├── create-better-auth-user.js  # User creation
├── test-auth.js                # Auth testing
├── test-server.js              # Mock API server
└── README.md                   # Scripts documentation
```

### Docs (`/docs`)
```
docs/
├── architecture/        # Architecture documentation
├── backend/            # Backend API documentation  
├── frontend/           # Frontend documentation
└── setup/              # Setup guides
```

## File Organization Principles

1. **Separation of Concerns**: Each directory has a specific purpose
2. **Development Tools**: All scripts and tools in `/scripts`
3. **Documentation**: All docs in `/docs` with clear categorization
4. **Clean Root**: Minimal files at root level for clarity
5. **Environment Separation**: Environment configs clearly named

## Usage

- **Development**: Run `pnpm dev` from root
- **Scripts**: Run scripts from root using `node scripts/script-name.js`
- **Documentation**: Reference docs in `/docs` for detailed information
- **Configuration**: Environment variables in `.env` (copy from `.env.example`)

This organization ensures a clean, maintainable project structure that scales well as the project grows.
