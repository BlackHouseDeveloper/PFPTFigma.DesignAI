#!/usr/bin/env node

/**
 * generate-components.mjs
 * Template-based component generator
 * Generates Razor components from templates using design tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const COMPONENTS_DIR = path.join(__dirname, '..', '..', 'src', 'Shared.UI', 'Components');
const TOKENS_FILE = path.join(__dirname, '..', '..', 'src', 'Shared.UI', 'Design', 'tokens', 'app.tokens.json');

/**
 * Load design tokens
 */
function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) {
    console.warn('⚠️  app.tokens.json not found. Run "make tokens.pull" first.');
    return null;
  }
  
  const data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
  console.log('✅ Loaded design tokens');
  return data;
}

/**
 * Generate component from template
 */
function generateComponent(templateName, componentName, tokens) {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.template`);
  
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️  Template ${templateName} not found, skipping...`);
    return;
  }
  
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Simple token replacement (can be enhanced with more sophisticated templating)
  template = template.replace(/\{\{COMPONENT_NAME\}\}/g, componentName);
  
  // Replace color tokens
  if (tokens.color) {
    Object.entries(tokens.color).forEach(([key, token]) => {
      template = template.replace(new RegExp(`\\{\\{COLOR_${key.toUpperCase()}\\}\\}`, 'g'), token.value);
    });
  }
  
  // Replace spacing tokens
  if (tokens.space) {
    Object.entries(tokens.space).forEach(([key, token]) => {
      template = template.replace(new RegExp(`\\{\\{SPACE_${key.toUpperCase()}\\}\\}`, 'g'), token.value);
    });
  }
  
  const outputPath = path.join(COMPONENTS_DIR, `${componentName}.razor`);
  fs.writeFileSync(outputPath, template, 'utf-8');
  console.log(`  ✅ Generated ${componentName}.razor`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Starting component generation...\n');
  
  try {
    const tokens = loadTokens();
    
    if (!tokens) {
      console.log('ℹ️  Skipping component generation (no tokens available)');
      return;
    }
    
    // Ensure components directory exists
    if (!fs.existsSync(COMPONENTS_DIR)) {
      fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
    }
    
    // Generate reference components (when templates exist)
    const componentTemplates = [
      { template: 'LoginForm', name: 'LoginForm' },
      { template: 'IntakeCard', name: 'IntakeCard' },
      { template: 'AppointmentsList', name: 'AppointmentsList' }
    ];
    
    componentTemplates.forEach(({ template, name }) => {
      generateComponent(template, name, tokens);
    });
    
    console.log('\n✨ Component generation completed!');
  } catch (error) {
    console.error('\n❌ Component generation failed:', error.message);
    process.exit(1);
  }
}

main();
