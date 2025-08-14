# Development Guide - Vevurn POS System

## 🚀 Quick Start

### Prerequisites
- Node.js 22.16.0+
- PostgreSQL 14+
- npm 10.0.0+

### Setup
```bash
# Clone and setup
git clone https://github.com/supserrr/vevurn.git
cd vevurn
./setup.sh
```

### Start Development
```bash
npm run dev
```

## 📁 Project Structure

```
vevurn/
├── frontend/                 # Next.js frontend (Turborepo)
│   ├── apps/
│   │   └── web/             # Main web application
│   └── packages/
│       ├── ui/              # Shared UI components
│       ├── eslint-config/   # ESLint configuration
│       └── typescript-config/ # TypeScript configuration
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   ├── utils/           # Utility functions
│   │   └── prisma/          # Database schema & seeds
│   └── prisma/
│       └── schema.prisma    # Database schema
├── shared/                  # Shared types & utilities
│   └── src/
│       ├── types.ts         # TypeScript types
│       ├── validation.ts    # Zod schemas
│       └── utils.ts         # Utility functions
└── README.md
```

## 🛠️ Development Workflow

### Backend Development

#### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Create and run migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

#### API Development
1. **Create Routes**: Add new routes in `backend/src/routes/`
2. **Controllers**: Implement business logic in controllers
3. **Middleware**: Add authentication, validation, etc.
4. **Testing**: Use tools like Postman or Thunder Client

#### Common Commands
```bash
cd backend

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint and fix
npm run lint:fix
```

### Frontend Development

#### Component Development
1. **Shared Components**: Add reusable components to `frontend/packages/ui/`
2. **App Components**: Add app-specific components to `frontend/apps/web/components/`
3. **Pages**: Create pages in `frontend/apps/web/app/`

#### State Management
- **Zustand**: For client state management
- **React Query**: For server state management
- **React Hook Form**: For form state

#### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Pre-built component library
- **CSS Variables**: For theming

#### Common Commands
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Lint and fix
npm run lint:fix

# Type check
npm run type-check
```

### Shared Package Development

The shared package contains common types, validation schemas, and utilities used by both frontend and backend.

```bash
cd shared

# Build the package
npm run build

# Watch for changes
npm run dev
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm run test          # Run all tests
npm run test:watch    # Watch mode
```

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
```

#### Frontend (`frontend/apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_APP_NAME="Vevurn POS"
```

### Database Configuration

1. **Local Development**: Use PostgreSQL locally
2. **Production**: Use managed PostgreSQL service
3. **Testing**: Use separate test database

## 📊 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales
- `GET /api/sales/:id` - Get sale details

### Reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports

## 🎯 Best Practices

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

### Database
- Use Prisma migrations for schema changes
- Never modify database directly in production
- Use transactions for complex operations
- Index frequently queried fields

### API Design
- Use RESTful conventions
- Implement proper error handling
- Add request validation
- Use appropriate HTTP status codes
- Document API endpoints

### Frontend
- Use TypeScript for all components
- Implement proper error boundaries
- Use React Query for API calls
- Follow component composition patterns
- Implement proper loading states

### Security
- Validate all inputs
- Use proper authentication
- Implement rate limiting
- Sanitize user inputs
- Use HTTPS in production

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Docker (Optional)
```bash
# Build images
docker-compose build

# Start services
docker-compose up
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection string in .env
echo $DATABASE_URL
```

#### Node Modules Issues
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### TypeScript Errors
```bash
# Regenerate types
npm run db:generate

# Check TypeScript configuration
npm run type-check
```

## 📝 Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
```
type(scope): description

Examples:
feat(products): add barcode scanning
fix(auth): resolve token expiration issue
docs(readme): update setup instructions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For questions or support:
- Create an issue on GitHub
- Check the documentation
- Review existing issues

---

Happy coding! 🚀
