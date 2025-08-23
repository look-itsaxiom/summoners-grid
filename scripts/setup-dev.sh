#!/bin/bash

# Development setup script for Summoner's Grid
# Sets up the development environment and validates the installation

set -e  # Exit on any error

echo "🎮 Setting up Summoner's Grid development environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up environment file
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. You may want to customize it for your setup."
else
    echo "✅ .env file already exists"
fi

# Start infrastructure services
echo "🐳 Starting infrastructure services (PostgreSQL, Redis)..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Test database connection
echo "🗄️ Testing database connection..."
# Add database migration/connection test here once we have the migration setup

# Run tests to validate setup
echo "🧪 Running tests to validate setup..."
./scripts/test-working.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Development environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   • Review and customize .env file if needed"
echo "   • Run 'npx nx serve @summoners-grid/api-server' to start the API server"
echo "   • Run 'npx nx serve @summoners-grid/game-server' to start the game server"
echo "   • Run 'npx nx serve @summoners-grid/game-client' to start the game client (note: has issues)"
echo ""
echo "🔧 Useful commands:"
echo "   • npm run test:working - Run all working tests"
echo "   • npm run dev:services - Start PostgreSQL and Redis"
echo "   • npx nx graph - View project dependency graph"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Project overview and setup"
echo "   • Summoner's Grid GDD.md - Game design document"
echo "   • docs/implementation-plan/07-GITHUB-ISSUES-BREAKDOWN.md - Implementation status"