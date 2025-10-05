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
const TOKENS_DIR = path.join(__dirname, '..', '..', '..', 'src', 'Shared.UI', 'Design', 'tokens');

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

  // Helper: Convert Figma color object to hex
  function figmaColorToHex(color) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    if (color.a !== undefined && color.a < 1) {
      const a = Math.round(color.a * 255);
      return (
        '#' +
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0') +
        a.toString(16).padStart(2, '0')
      );
    }
    return (
      '#' +
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0')
    );
  }

  // Helper: Recursively traverse document tree to find nodes by styleId
  function findNodeWithStyleId(node, styleId, nodes = []) {
    if (node.styles && node.styles.fill === styleId && node.fills && node.fills.length > 0) {
      nodes.push(node);
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => findNodeWithStyleId(child, styleId, nodes));
    }
    return nodes;
  }

  const tokens = {
    color: {},
    typography: {},
    space: {},
    radius: {},
    elevation: {}
  };

  // Map to standardized token keys
  const colorMapping = {
    'primary': 'primary',
    'onPrimary': 'onPrimary',
    'on-primary': 'onPrimary',
    'secondary': 'secondary',
    'onSecondary': 'onSecondary',
    'on-secondary': 'onSecondary',
    'surface': 'surface',
    'onSurface': 'onSurface',
    'on-surface': 'onSurface',
    'background': 'background',
    'onBackground': 'onBackground',
    'on-background': 'onBackground',
    'success': 'success',
    'warning': 'warning',
    'error': 'error',
    'info': 'info'
  };

  if (figmaData.styles && figmaData.document) {
    Object.entries(figmaData.styles).forEach(([key, style]) => {
      if (style.styleType === 'FILL') {
        // Find a node that uses this style
        const nodes = findNodeWithStyleId(figmaData.document, key);
        let colorValue = '#000000';
        if (nodes.length > 0) {
          // Use the first node found
          const fills = nodes[0].fills;
          if (Array.isArray(fills)) {
            const solidFill = fills.find(f => f.type === 'SOLID');
            if (solidFill && solidFill.color) {
              colorValue = figmaColorToHex({
                r: solidFill.color.r,
                g: solidFill.color.g,
                b: solidFill.color.b,
                a: solidFill.opacity !== undefined ? solidFill.opacity : (solidFill.color.a !== undefined ? solidFill.color.a : 1)
              });
            }
          }
        }
        
        // Map to standardized key or use original name
        const styleName = style.name.toLowerCase();
        const mappedKey = colorMapping[styleName] || styleName;
        
        tokens.color[mappedKey] = {
          value: colorValue,
          type: 'color'
        };
      }
    });
  }

  // Add default tokens if missing (for development)
  const defaultColors = {
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    secondary: '#5856D6',
    onSecondary: '#FFFFFF',
    surface: '#FFFFFF',
    onSurface: '#000000',
    background: '#F2F2F7',
    onBackground: '#000000',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF'
  };

  Object.entries(defaultColors).forEach(([key, value]) => {
    if (!tokens.color[key]) {
      tokens.color[key] = {
        value: value,
        type: 'color'
      };
    }
  });

  // Add default spacing tokens
  tokens.space = {
    xs: { value: '4px', type: 'spacing' },
    sm: { value: '8px', type: 'spacing' },
    md: { value: '16px', type: 'spacing' },
    lg: { value: '24px', type: 'spacing' },
    xl: { value: '32px', type: 'spacing' }
  };

  // Add default radius tokens
  tokens.radius = {
    sm: { value: '4px', type: 'borderRadius' },
    md: { value: '8px', type: 'borderRadius' },
    lg: { value: '12px', type: 'borderRadius' },
    xl: { value: '16px', type: 'borderRadius' },
    '2xl': { value: '24px', type: 'borderRadius' }
  };

  // Add default elevation tokens
  tokens.elevation = {
    level0: { value: 'none', type: 'shadow' },
    level1: { value: '0 1px 3px rgba(0,0,0,0.12)', type: 'shadow' },
    level2: { value: '0 4px 6px rgba(0,0,0,0.12)', type: 'shadow' },
    level3: { value: '0 10px 20px rgba(0,0,0,0.12)', type: 'shadow' },
    level4: { value: '0 20px 25px rgba(0,0,0,0.15)', type: 'shadow' }
  };

  // Add default typography tokens
  tokens.typography = {
    display: { fontFamily: 'system-ui', fontSize: '32px', fontWeight: '700', lineHeight: '40px', type: 'typography' },
    title: { fontFamily: 'system-ui', fontSize: '24px', fontWeight: '600', lineHeight: '32px', type: 'typography' },
    body: { fontFamily: 'system-ui', fontSize: '16px', fontWeight: '400', lineHeight: '24px', type: 'typography' },
    caption: { fontFamily: 'system-ui', fontSize: '12px', fontWeight: '400', lineHeight: '16px', type: 'typography' }
  };

  console.log(`✅ Extracted ${Object.keys(tokens.color).length} color tokens`);
  console.log(`✅ Added ${Object.keys(tokens.space).length} spacing tokens`);
  console.log(`✅ Added ${Object.keys(tokens.radius).length} radius tokens`);
  console.log(`✅ Added ${Object.keys(tokens.elevation).length} elevation tokens`);
  console.log(`✅ Added ${Object.keys(tokens.typography).length} typography tokens`);
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

  // Save as single app.tokens.json (single source of truth)
  const tokenFile = path.join(TOKENS_DIR, 'app.tokens.json');
  const tokenContent = {
    $schema: './app.tokens.schema.json',
    _comment: 'AUTO-GENERATED from Figma. Edit /Design/tokens/app.tokens.json only.',
    _generated: new Date().toISOString(),
    ...tokens
  };

  fs.writeFileSync(
    tokenFile,
    JSON.stringify(tokenContent, null, 2),
    'utf-8'
  );
  console.log(`  📄 Saved app.tokens.json`);

  // Also save legacy format for backwards compatibility (will be removed later)
  Object.entries(tokens).forEach(([category, tokenData]) => {
    const filePath = path.join(TOKENS_DIR, `${category}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(tokenData, null, 2),
      'utf-8'
    );
    console.log(`  📄 Saved ${category}.json (legacy)`);
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
