# ⚙️ Configuration Directory

This directory contains all configuration files for the Vevurn POS project, organized by category.

## 📁 Directory Structure

```
config/
├── .nvmrc                      # Node.js version specification
├── eslint/
│   └── root.eslintrc.js        # Root ESLint configuration
├── prettier/
│   └── prettier.config.js      # Code formatting configuration
└── typescript/
    └── tsconfig.json           # Root TypeScript configuration
```

## 🔧 Configuration Files

### Node.js Version (`.nvmrc`)
- Specifies the Node.js version for the project
- Used by `nvm` for automatic version switching
- Ensures consistent Node.js version across team

### ESLint Configuration (`eslint/root.eslintrc.js`)
- Root-level code linting rules
- Extends shared configurations
- Enforces code quality standards

### Prettier Configuration (`prettier/prettier.config.js`)
- Code formatting rules
- Consistent code style across project
- Auto-formatting on save

### TypeScript Configuration (`typescript/tsconfig.json`)
- Root TypeScript compiler options
- Path mapping and module resolution
- Type checking rules for the entire monorepo

## 🎯 Usage

These configurations are referenced by:
- Build tools (pnpm, Next.js, etc.)
- IDE/Editor extensions
- CI/CD pipelines
- Development scripts

## 🔗 Related Configurations

Additional configurations exist in package-specific directories:
- `frontend/config/` - Frontend-specific configurations
- `backend/config/` - Backend-specific configurations
- `frontend/packages/*/` - Package-specific configurations

## 📝 Maintenance

When updating configurations:
1. Test changes in development first
2. Update related package configurations if needed
3. Document significant changes in commit messages
4. Verify CI/CD pipelines still work

---

💡 **Tip**: Keep configurations as minimal as possible and extend shared configs when available.
