# Migration Guide: From Clerk to Better-Auth

This guide will help you migrate your Vevurn POS system from Clerk authentication to better-auth.

## ⚠️ Important: Backup Your Database First!

```bash
# Create a database backup before starting
pg_dump your_database_url > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Step 1: Environment Variables

1. Generate a secure secret:
```bash
./scripts/generate-auth-secret.sh
```

2. Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

3. Add the generated secret to your `.env` file along with other required variables.

## Step 2: Database Migration

1. **Run the database migration:**
```bash
cd backend
psql $DATABASE_URL -f prisma/migrations/001_add_better_auth.sql
```

2. **Generate new Prisma client:**
```bash
cd backend
pnpm exec prisma generate --schema=prisma/schema.prisma
```

3. **Verify the migration worked:**
```bash
cd backend  
pnpm exec prisma db pull --schema=prisma/schema.prisma
```

## Step 3: Data Migration (if you have existing users)

If you have existing users with Clerk, you'll need to migrate them. Here's a sample script:

```sql
-- Update existing users to be compatible with better-auth
UPDATE users SET 
  name = COALESCE(firstName || ' ' || lastName, email),
  emailVerified = true,
  role = LOWER(role::text)
WHERE clerkId IS NOT NULL;

-- Remove clerkId column after migration
-- ALTER TABLE users DROP COLUMN clerkId;
```

## Step 4: Update Authentication Calls

Replace Clerk authentication calls throughout your application:

### Before (Clerk):
```typescript
import { useUser, useAuth } from "@clerk/nextjs"

const { user } = useUser()
const { signOut } = useAuth()
```

### After (Better-Auth):
```typescript
import { useAuth, authActions } from "@/hooks/use-auth"

const { user, isAuthenticated } = useAuth()
const handleSignOut = () => authActions.signOut()
```

## Step 5: Update Middleware

Replace Clerk middleware with better-auth middleware. Create `middleware.ts`:

```typescript
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Check if user is authenticated for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await auth.api.getSession({
      headers: request.headers
    })
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
```

## Step 6: Update API Routes

Replace Clerk authentication in API routes:

### Before (Clerk):
```typescript
import { auth } from "@clerk/nextjs"

export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
}
```

### After (Better-Auth):
```typescript
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers
  })
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
}
```

## Step 7: Update Login/Registration Forms

Replace Clerk components with custom forms using better-auth:

```typescript
import { authActions } from "@/hooks/use-auth"

export default function LoginForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const response = await authActions.signIn(
      formData.get('email') as string,
      formData.get('password') as string
    )
    
    if (response.ok) {
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  )
}
```

## Step 8: Test the Migration

1. **Start your development servers:**
```bash
# Backend
cd backend && pnpm dev

# Frontend
cd frontend && pnpm dev
```

2. **Test authentication flow:**
   - Visit `/api/auth/sign-up` to create a new user
   - Test login/logout functionality
   - Verify protected routes work
   - Check user data is properly stored

3. **Test POS-specific features:**
   - User roles and permissions
   - Discount controls
   - Employee management

## Step 9: Cleanup (After Successful Migration)

1. **Remove Clerk dependencies:**
```bash
cd frontend
pnpm remove @clerk/nextjs @clerk/themes
```

2. **Remove Clerk components and imports** from your codebase

3. **Update package.json** scripts if needed

## Step 10: Deploy to Production

1. **Set production environment variables**
2. **Run migration on production database** (with backup!)
3. **Deploy updated code**
4. **Monitor for issues**

## Troubleshooting

### Common Issues:

1. **"BETTER_AUTH_SECRET not found"**
   - Make sure you've set the environment variable
   - Ensure it's at least 32 characters long

2. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Check if PostgreSQL is running

3. **Prisma client out of sync**
   - Run `pnpm exec prisma generate` again
   - Restart your development server

4. **TypeScript errors**
   - Make sure all packages are installed
   - Check import paths are correct
   - Restart TypeScript server in VS Code

## Rollback Plan

If you need to rollback:

1. **Restore database backup:**
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

2. **Revert code changes** using Git
3. **Reinstall Clerk dependencies**

---

Need help? Check the logs and error messages, or refer to the better-auth documentation at https://better-auth.com/
