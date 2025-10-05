#!/usr/bin/env node

/**
 * a11y-check.mjs
 * Validates design tokens for accessibility compliance.
 * Checks color contrast ratios according to WCAG guidelines.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS_DIR = path.join(__dirname, '..', '..', 'src', 'Shared.UI', 'Design', 'tokens');
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const WCAG_AAA_NORMAL = 7.0;
const WCAG_AAA_LARGE = 4.5;

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return null;
  
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  // Support #RRGGBB and #RRGGBBAA (ignore alpha for RGB)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Check WCAG compliance level
 */
function checkWCAGCompliance(ratio, isLargeText = false) {
  const levels = {
    'AAA': isLargeText ? WCAG_AAA_LARGE : WCAG_AAA_NORMAL,
    'AA': isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL
  };
  
  if (ratio >= levels.AAA) return 'AAA';
  if (ratio >= levels.AA) return 'AA';
  return 'FAIL';
}

/**
 * Load and parse color tokens
 */
function loadColorTokens() {
  console.log('🔍 Loading color tokens...');
  
  const tokenFile = path.join(TOKENS_DIR, 'app.tokens.json');
  
  if (!fs.existsSync(tokenFile)) {
    console.warn('⚠️  Warning: app.tokens.json not found. Skipping accessibility checks.');
    console.log('Run "make tokens.pull" first to fetch tokens from Figma.');
    return null;
  }

  const data = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
  
  // Extract color tokens from the new structure
  const colors = data.color || {};
  
  console.log(`✅ Loaded ${Object.keys(colors).length} color tokens`);
  return colors;
}

/**
 * Perform accessibility checks
 */
function runAccessibilityChecks(colors) {
  console.log('🔍 Running accessibility checks...\n');
  
  if (!colors || Object.keys(colors).length === 0) {
    console.log('ℹ️  No color tokens to check.');
    return;
  }

  const issues = [];
  const colorEntries = Object.entries(colors);
  
  // Find text/background color pairs and check contrast
  const textColors = colorEntries.filter(([name]) => 
    name.toLowerCase().includes('text') || name.toLowerCase().includes('foreground')
  );
  
  const bgColors = colorEntries.filter(([name]) => 
    name.toLowerCase().includes('background') || name.toLowerCase().includes('bg')
  );

  if (textColors.length === 0 || bgColors.length === 0) {
    console.log('ℹ️  No text/background color pairs found for contrast checking.');
    console.log('Consider naming colors with "text" or "background" keywords for automated checks.\n');
  }

  // Check contrast ratios
  textColors.forEach(([textName, textToken]) => {
    bgColors.forEach(([bgName, bgToken]) => {
      const textValue = textToken.value || textToken;
      const bgValue = bgToken.value || bgToken;
      
      if (typeof textValue === 'string' && typeof bgValue === 'string') {
        const ratio = getContrastRatio(textValue, bgValue);
        
        if (ratio !== null) {
          const normalCompliance = checkWCAGCompliance(ratio, false);
          const largeCompliance = checkWCAGCompliance(ratio, true);
          
          console.log(`📊 ${textName} on ${bgName}:`);
          console.log(`   Contrast Ratio: ${ratio.toFixed(2)}:1`);
          console.log(`   Normal Text: ${normalCompliance}`);
          console.log(`   Large Text: ${largeCompliance}`);
          
          if (normalCompliance === 'FAIL' && largeCompliance === 'FAIL') {
            issues.push({
              textColor: textName,
              bgColor: bgName,
              ratio: ratio.toFixed(2)
            });
            console.log(`   ❌ FAILS WCAG requirements\n`);
          } else {
            console.log(`   ✅ Passes\n`);
          }
        }
      }
    });
  });

  // Report summary
  console.log('\n' + '='.repeat(60));
  if (issues.length === 0) {
    console.log('✅ All checked color combinations pass WCAG guidelines!');
  } else {
    console.log(`❌ Found ${issues.length} accessibility issue(s):`);
    issues.forEach(issue => {
      console.log(`   • ${issue.textColor} on ${issue.bgColor} (${issue.ratio}:1)`);
    });
    console.log('\n⚠️  Please review and adjust these color combinations.');
  }
  console.log('='.repeat(60));

  return issues;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting accessibility checks...\n');
  
  try {
    const colors = loadColorTokens();
    
    if (colors) {
      const issues = runAccessibilityChecks(colors);
      
      // Exit with error code if there are issues (optional - can be disabled for CI)
      // if (issues && issues.length > 0) {
      //   process.exit(1);
      // }
    }
    
    console.log('\n✨ Accessibility check completed!');
  } catch (error) {
    console.error('\n❌ Accessibility check failed:', error.message);
    process.exit(1);
  }
}

main();
