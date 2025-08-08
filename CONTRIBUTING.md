# Contributing to Vevurn POS System

Thank you for your interest in contributing to Vevurn! 🎉

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- pnpm (v8 or higher)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vevurn.git
   cd vevurn
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Environment**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit the .env files with your local database credentials
   ```

4. **Run Database Setup**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. **Start Development**
   ```bash
   pnpm dev
   ```

## 🏗️ Project Structure

```
vevurn/
├── shared/          # Shared types, utilities, constants
├── backend/         # Express.js API server
├── frontend/        # Next.js web application
├── database/        # Database schemas and migrations
├── docs/           # Documentation
└── .github/        # CI/CD workflows
```

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Write self-documenting code with comments where necessary

### Git Workflow
1. Create a feature branch from `main`
2. Make your changes in small, logical commits
3. Write descriptive commit messages
4. Push your branch and create a Pull Request

### Branch Naming Convention
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation changes
- `refactor/description` - for code refactoring

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(auth): add JWT token refresh functionality`
- `fix(inventory): resolve stock calculation bug`
- `docs(readme): update installation instructions`

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm backend:test
pnpm frontend:test
pnpm shared:test

# Run with coverage
pnpm test:coverage
```

### Writing Tests
- Write unit tests for all new functions
- Add integration tests for API endpoints
- Include end-to-end tests for critical user flows
- Aim for at least 80% code coverage

## 📝 Pull Request Process

1. **Before Creating a PR**
   - Ensure your code passes all tests
   - Run linting and fix any issues
   - Update documentation if needed
   - Test your changes locally

2. **PR Requirements**
   - Clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Add tests for new functionality

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Added new tests
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   
   ## Related Issues
   Fixes #issue_number
   ```

## 🐛 Reporting Bugs

### Before Reporting
- Check if the bug has already been reported
- Try to reproduce the issue
- Gather relevant information

### Bug Report Template
```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 91]
- Node.js version: [e.g. 18.17.0]
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Feature Description**
Clear description of the feature

**Problem Solved**
What problem does this solve?

**Proposed Solution**
How should this work?

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Any other relevant information
```

## 📚 Documentation

### Documentation Standards
- Use clear, concise language
- Include code examples
- Keep documentation up-to-date
- Use proper markdown formatting

### Documentation Types
- API documentation (auto-generated)
- User guides
- Developer guides
- Architecture documentation

## 🏷️ Labels and Milestones

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority:high` - High priority
- `priority:medium` - Medium priority
- `priority:low` - Low priority

## 🌟 Recognition

Contributors who make significant contributions will be:
- Listed in the README
- Mentioned in release notes
- Invited to join the core team (for ongoing contributors)

## 📞 Getting Help

If you need help or have questions:
- Open an issue for discussion
- Join our Discord community
- Email the development team

## 🎯 Development Focus Areas

We're currently focusing on:
- 🔐 Authentication and authorization improvements
- 📊 Advanced reporting features
- 🎨 UI/UX enhancements
- 🚀 Performance optimizations
- 🧪 Test coverage improvements

Thank you for contributing to Vevurn! 🙏
