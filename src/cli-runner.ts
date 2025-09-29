#!/usr/bin/env node

/**
 * CLI Runner - Standalone entry point for the CLI tool
 */

const { SummonersGridCLI } = require('./cli');

const cli = new SummonersGridCLI();
cli.start();