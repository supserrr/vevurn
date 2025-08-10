/**
 * Prisma Configuration
 * 
 * This replaces the deprecated "prisma" section in package.json
 * Ref: https://pris.ly/prisma-config
 */
export default {
  schema: './backend/prisma/schema.prisma',
  // Seed script for development/testing
  seed: 'ts-node backend/prisma/seed.ts'
}
