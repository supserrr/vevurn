# Database Documentation

This directory contains documentation related to database configuration, schema, and integration for the Vevurn POS Backend.

## Contents

- `BETTER_AUTH_DATABASE.md` - Better Auth database configuration and schema

## Database Overview

The backend uses:

- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** Better Auth integration
- **Migrations:** Prisma migrations

## Schema Overview

The database includes tables for:

### Authentication (Better Auth)
- `users` - User accounts and profiles
- `sessions` - Active user sessions  
- `accounts` - OAuth account linkings
- `verificationTokens` - Email verification tokens

### Business Data
- `products` - Product catalog
- `categories` - Product categories
- `sales` - Sales transactions
- `customers` - Customer information
- `suppliers` - Supplier management
- `loans` - Loan tracking
- `settings` - Application settings

## Configuration

### Database URL
Set the `DATABASE_URL` environment variable:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/vevurn_db"
```

### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Better Auth Integration

Better Auth automatically manages authentication-related tables:

- User registration and login
- Session management  
- OAuth account linking
- Password resets and email verification

See the authentication documentation in [`../auth/`](../auth/) for more details.

## Development

### Local Database Setup

1. **Install PostgreSQL locally** or use a cloud service
2. **Create database:** `createdb vevurn_db`
3. **Set environment variable:** `DATABASE_URL=...`
4. **Run migrations:** `npx prisma migrate deploy`
5. **Generate client:** `npx prisma generate`

### Production Database

For production deployment:

1. Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
2. Set `DATABASE_URL` in production environment
3. Run migrations as part of deployment process
4. Monitor database performance and connections
