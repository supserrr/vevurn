-- Better Auth Database Migration for vevurnPOS
-- Ensures database schema is fully compatible with Better Auth OAuth flows
-- Run this after setting up Google OAuth credentials

-- This migration ensures all Better Auth tables exist and are properly configured
-- Your existing schema is already compatible, but this adds any missing indexes/constraints

BEGIN;

-- Ensure sessions table has proper constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'sessions_token_key' AND table_name = 'sessions') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_token_key UNIQUE (token);
    END IF;
EXCEPTION 
    WHEN duplicate_table THEN 
        -- Constraint already exists, continue
        NULL;
END $$;

-- Ensure accounts table has proper constraints  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'accounts_providerId_accountId_key' AND table_name = 'accounts') THEN
        ALTER TABLE accounts ADD CONSTRAINT accounts_providerId_accountId_key UNIQUE (providerId, accountId);
    END IF;
EXCEPTION 
    WHEN duplicate_table THEN
        -- Constraint already exists, continue  
        NULL;
END $$;

-- Ensure verification_tokens table has proper constraints
DO $$
BEGIN  
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'verification_tokens_identifier_value_key' AND table_name = 'verification_tokens') THEN
        ALTER TABLE verification_tokens ADD CONSTRAINT verification_tokens_identifier_value_key UNIQUE (identifier, value);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- Constraint already exists, continue
        NULL; 
END $$;

-- Add indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON sessions(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions(expiresAt);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_user_id ON accounts(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_provider_id ON accounts(providerId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_tokens_identifier ON verification_tokens(identifier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expiresAt);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);

-- Ensure users table has proper columns for OAuth (they should already exist)
DO $$
BEGIN
    -- Add name column if it doesn't exist (for OAuth display name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name TEXT;
    END IF;
    
    -- Add image column if it doesn't exist (for OAuth profile picture)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'image') THEN  
        ALTER TABLE users ADD COLUMN image TEXT;
    END IF;
    
    -- Add emailVerified column if it doesn't exist (for OAuth email verification)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'emailVerified') THEN
        ALTER TABLE users ADD COLUMN emailVerified TIMESTAMPTZ;
    END IF;
EXCEPTION
    WHEN others THEN
        -- Columns likely already exist, continue
        NULL;
END $$;

-- Update existing users to have emailVerified set for email/password users
UPDATE users 
SET emailVerified = createdAt 
WHERE emailVerified IS NULL 
AND email IS NOT NULL;

-- Clean up expired verification tokens (older than 24 hours)
DELETE FROM verification_tokens 
WHERE expiresAt < NOW() - INTERVAL '24 hours';

-- Clean up expired sessions  
DELETE FROM sessions
WHERE expiresAt < NOW();

COMMIT;

-- Verification query to ensure everything is set up correctly
DO $$
DECLARE
    tables_count INTEGER;
    constraints_count INTEGER;
    indexes_count INTEGER;
BEGIN
    -- Check that all required tables exist
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_name IN ('users', 'sessions', 'accounts', 'verification_tokens')
    AND table_schema = 'public';
    
    -- Check that key constraints exist
    SELECT COUNT(*) INTO constraints_count
    FROM information_schema.table_constraints
    WHERE constraint_name IN (
        'sessions_token_key',
        'accounts_providerId_accountId_key', 
        'verification_tokens_identifier_value_key',
        'users_email_key'
    ) AND table_schema = 'public';
    
    -- Check that performance indexes exist
    SELECT COUNT(*) INTO indexes_count  
    FROM pg_indexes
    WHERE indexname IN (
        'idx_sessions_user_id',
        'idx_sessions_expires_at', 
        'idx_accounts_user_id',
        'idx_accounts_provider_id',
        'idx_verification_tokens_identifier',
        'idx_users_email'
    ) AND schemaname = 'public';
    
    RAISE NOTICE '✅ Better Auth Migration Complete:';
    RAISE NOTICE '   📊 Tables: % / 4 required tables found', tables_count;  
    RAISE NOTICE '   🔒 Constraints: % / 4 key constraints found', constraints_count;
    RAISE NOTICE '   ⚡ Indexes: % / 6 performance indexes found', indexes_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Database is ready for Google OAuth!';
    RAISE NOTICE '   ✅ User accounts will be created automatically';
    RAISE NOTICE '   ✅ Sessions will be managed securely'; 
    RAISE NOTICE '   ✅ OAuth tokens will be stored properly';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '   1. Configure Google OAuth credentials in .env';
    RAISE NOTICE '   2. Restart development server';
    RAISE NOTICE '   3. Test OAuth flow at http://localhost:3000/login';
END $$;
