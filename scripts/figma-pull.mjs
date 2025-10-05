#!/usr/bin/env node

/**
 * figma-pull.mjs
 * Fetches design tokens from Figma API and saves them locally.
 * Requires FIGMA_TOKEN and FIGMA_FILE_KEY environment variables.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
  console.error('❌ Error: FIGMA_TOKEN and FIGMA_FILE_KEY must be set in environment variables.');
  console.error('Please configure these secrets in GitHub Settings or your local .env file.');
  process.exit(1);
}

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const TOKENS_DIR = path.join(__dirname, '..', 'tokens');

/**
 * Fetch Figma file data
 */
async function fetchFigmaFile() {
  console.log('🔍 Fetching Figma file...');
  
  try {
    const response = await axios.get(
      `${FIGMA_API_BASE}/files/${FIGMA_FILE_KEY}`,
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN
        }
      }
    );
    
    console.log('✅ Figma file fetched successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch Figma file:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Extract design tokens from Figma file structure
 */
function extractTokens(figmaData) {
  console.log('🔧 Extracting design tokens...');
  
  const tokens = {
    colors: {},
    typography: {},
    spacing: {}
  };

  // Basic extraction logic - this would need to be customized based on
  // how your Figma file is structured
  // For now, we'll create a placeholder structure
  
  if (figmaData.styles) {
    Object.entries(figmaData.styles).forEach(([key, style]) => {
      if (style.styleType === 'FILL') {
        tokens.colors[style.name] = {
          value: style.description || '#000000',
          type: 'color'
        };
      }
    });
  }

  console.log(`✅ Extracted ${Object.keys(tokens.colors).length} color tokens`);
  return tokens;
}

/**
 * Save tokens to file system
 */
function saveTokens(tokens) {
  console.log('💾 Saving tokens...');
  
  // Ensure tokens directory exists
  if (!fs.existsSync(TOKENS_DIR)) {
    fs.mkdirSync(TOKENS_DIR, { recursive: true });
  }

  // Save each token category
  Object.entries(tokens).forEach(([category, tokenData]) => {
    const filePath = path.join(TOKENS_DIR, `${category}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(tokenData, null, 2),
      'utf-8'
    );
    console.log(`  📄 Saved ${category}.json`);
  });

  console.log('✅ All tokens saved successfully');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Figma token extraction...\n');
  
  try {
    const figmaData = await fetchFigmaFile();
    const tokens = extractTokens(figmaData);
    saveTokens(tokens);
    
    console.log('\n✨ Token extraction completed successfully!');
  } catch (error) {
    console.error('\n❌ Token extraction failed:', error.message);
    process.exit(1);
  }
}

main();
