#!/bin/bash

# Vevurn POS System Setup Script
# This script will set up the complete development environment

set -e

echo "🚀 Setting up Vevurn POS System..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 22.16.0 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
echo "✅ Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm 10.0.0 or higher."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm version: $NPM_VERSION"

echo ""
echo "📦 Installing dependencies..."
echo "=============================="

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Install shared dependencies
echo "Installing shared dependencies..."
cd shared && npm install && cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "🔧 Setting up environment files..."
echo "=================================="

# Copy environment files
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (please update with your values)"
else
    echo "✅ backend/.env already exists"
fi

echo ""
echo "🗄️ Database setup..."
echo "===================="

echo "Please ensure PostgreSQL is running and create a database named 'vevurn_pos'"
echo "Update the DATABASE_URL in backend/.env with your database connection string"

read -p "Have you set up the database and updated the .env file? (y/N): " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
    echo "Generating Prisma client..."
    npm run db:generate
    
    echo "Running database migrations..."
    npm run db:migrate
    
    echo "Seeding database with initial data..."
    npm run db:seed
    
    echo "✅ Database setup complete!"
else
    echo "⚠️  Skipping database setup. Run the following commands after setting up your database:"
    echo "   npm run db:generate"
    echo "   npm run db:migrate"
    echo "   npm run db:seed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. If you skipped database setup, run the database commands shown above"
echo "3. Start the development servers:"
echo "   npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo ""
echo "🔑 Authentication:"
echo "   Create accounts through the application signup process"
echo "   Admin accounts must be created through the backend user management"
echo ""
echo "📚 For more information, see the README.md file"
echo ""
echo "Happy coding! 🚀"
