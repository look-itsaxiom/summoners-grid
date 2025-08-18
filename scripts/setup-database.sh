#!/bin/bash

# Summoner's Grid Database Initialization Script
# This script sets up the database for development

set -e

echo "🏗️  Summoner's Grid Database Setup"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start database services
echo "🐳 Starting database services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done

echo "✅ Redis is ready!"

# Navigate to database package
cd packages/database

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️  Running database migrations..."
npx prisma db push

# Seed the database
echo "🌱 Seeding database with sample data..."
npx tsx prisma/seed.ts

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🎮 Your Summoner's Grid database is ready with:"
echo "   • Alpha Set card templates"
echo "   • Sample users and card instances"
echo "   • Digital provenance tracking"
echo "   • Sample decks and game data"
echo ""
echo "🔗 Useful commands:"
echo "   • View database: npx prisma studio"
echo "   • Reset database: npx prisma migrate reset"
echo "   • Generate client: npx prisma generate"
echo ""
echo "🌐 Database URLs:"
echo "   • PostgreSQL: postgresql://postgres:password@localhost:5432/summoners_grid"
echo "   • Redis: redis://localhost:6379"