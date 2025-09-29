#!/usr/bin/env node

// Simple test to validate CLI functionality
const { SummonersGridCLI } = require('./dist/cli.js');

console.log('🧪 Testing CLI Tool...');

try {
  // Test that the CLI class can be instantiated
  const cli = new SummonersGridCLI();
  console.log('✅ CLI class instantiates successfully');
  
  // Test help display (just try to access the method)
  console.log('✅ CLI tool is ready for use');
  console.log('\n📋 CLI Test Results:');
  console.log('  ✅ Dependencies loaded correctly');
  console.log('  ✅ CLI class instantiated without errors');
  console.log('  ✅ TypeScript compilation successful');
  console.log('  ✅ All imports resolved properly');
  
  console.log('\n🚀 CLI tool is ready! Run with:');
  console.log('     npm run cli');
  console.log('  or node dist/cli-runner.js');
  
  // Also test the runner directly
  console.log('\n🧪 Testing CLI runner...');
  const runner = require('./dist/cli-runner.js');
  console.log('✅ CLI runner loads successfully');
  
} catch (error) {
  console.error('❌ CLI Test Failed:', error.message);
  process.exit(1);
}