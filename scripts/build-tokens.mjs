#!/usr/bin/env node

/**
 * build-tokens.mjs
 * Uses Style Dictionary to transform design tokens into platform-specific formats.
 * Generates XAML, CSS, and JSON artifacts.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS_DIR = path.join(__dirname, '..', 'tokens');
const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts');

/**
 * Check if tokens directory exists and has files
 */
function validateTokensExist() {
  console.log('🔍 Checking for token files...');
  
  if (!fs.existsSync(TOKENS_DIR)) {
    console.error('❌ Error: tokens/ directory does not exist.');
    console.error('Please run "pnpm run figma:pull" first to fetch tokens from Figma.');
    process.exit(1);
  }

  const tokenFiles = fs.readdirSync(TOKENS_DIR).filter(f => f.endsWith('.json'));
  
  if (tokenFiles.length === 0) {
    console.error('❌ Error: No token files found in tokens/ directory.');
    console.error('Please run "pnpm run figma:pull" first to fetch tokens from Figma.');
    process.exit(1);
  }

  console.log(`✅ Found ${tokenFiles.length} token file(s): ${tokenFiles.join(', ')}`);
}

/**
 * Ensure artifacts directory exists
 */
function ensureArtifactsDir() {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    console.log('📁 Created artifacts/ directory');
  }
}

/**
 * Run Style Dictionary build
 */
function buildTokens() {
  console.log('🔨 Building design tokens with Style Dictionary...');
  
  try {
    // Run style-dictionary build command
    // Using the config file we created
    execSync('node_modules/.bin/style-dictionary build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log('✅ Token build completed successfully');
  } catch (error) {
    console.error('❌ Failed to build tokens:', error.message);
    process.exit(1);
  }
}

/**
 * Verify artifacts were created
 */
function verifyArtifacts() {
  console.log('🔍 Verifying generated artifacts...');
  
  const expectedFiles = [
    'design-tokens.css',
    'design-tokens.xaml',
    'design-tokens.json'
  ];

  const missingFiles = [];
  
  expectedFiles.forEach(file => {
    const filePath = path.join(ARTIFACTS_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`  ✅ ${file} (${stats.size} bytes)`);
    } else {
      missingFiles.push(file);
      console.log(`  ❌ ${file} - NOT FOUND`);
    }
  });

  if (missingFiles.length > 0) {
    console.error(`\n❌ Warning: ${missingFiles.length} expected file(s) were not generated.`);
  } else {
    console.log('\n✅ All expected artifacts were generated successfully');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting token build process...\n');
  
  try {
    validateTokensExist();
    ensureArtifactsDir();
    buildTokens();
    verifyArtifacts();
    
    console.log('\n✨ Token build process completed!');
  } catch (error) {
    console.error('\n❌ Token build failed:', error.message);
    process.exit(1);
  }
}

main();
