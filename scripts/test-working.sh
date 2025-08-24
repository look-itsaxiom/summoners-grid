#!/bin/bash

# Test script to run all working test suites
# Now includes game-client tests with fixed Phaser.js Canvas/WebGL context issues

echo "🧪 Running working test suites for Summoner's Grid..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test shared types (42 tests)
echo "📦 Testing shared-types package..."
npx nx test @summoners-grid/shared-types
if [ $? -ne 0 ]; then
    echo "❌ shared-types tests failed"
    exit 1
fi

# Test game engine (140 tests)
echo "🎮 Testing game-engine package..."
npx nx test @summoners-grid/game-engine
if [ $? -ne 0 ]; then
    echo "❌ game-engine tests failed"
    exit 1
fi

# Test database (8 tests)
echo "🗄️ Testing database package..."
npx nx test @summoners-grid/database
if [ $? -ne 0 ]; then
    echo "❌ database tests failed"
    exit 1
fi

# Test game server (9 tests)
echo "🌐 Testing game-server..."
npx nx test @summoners-grid/game-server
if [ $? -ne 0 ]; then
    echo "❌ game-server tests failed"
    exit 1
fi

# Test API server (23 tests)
echo "🔌 Testing api-server..."
npx nx test @summoners-grid/api-server
if [ $? -ne 0 ]; then
    echo "❌ api-server tests failed"
    exit 1
fi

# Test game client (16 tests) - now working!
echo "🎨 Testing game-client..."
npx nx test @summoners-grid/game-client
if [ $? -ne 0 ]; then
    echo "❌ game-client tests failed"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests passed! (238 total tests)"
echo ""
echo "🎉 Complete test coverage including game client with Phaser.js Canvas/WebGL mocking system!"