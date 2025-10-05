#!/usr/bin/env node

/**
 * Tokenizer Agent
 * Validates and processes design tokens
 * Input: JSON from stdin
 * Output: JSON to stdout
 * 
 * Deterministic - no LLM needed
 */

import fs from 'fs';
import path from 'path';

async function main() {
  let input = '';
  
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      
      let result = {
        status: 'success',
        agent: 'tokenizer',
        timestamp: new Date().toISOString()
      };
      
      if (data.action === 'validate' && data.tokensPath) {
        // Validate tokens file exists and structure
        if (fs.existsSync(data.tokensPath)) {
          const tokens = JSON.parse(fs.readFileSync(data.tokensPath, 'utf-8'));
          
          result.validation = {
            fileExists: true,
            hasColors: !!tokens.color && Object.keys(tokens.color).length > 0,
            hasTypography: !!tokens.typography && Object.keys(tokens.typography).length > 0,
            hasSpacing: !!tokens.space && Object.keys(tokens.space).length > 0,
            tokenCount: {
              colors: tokens.color ? Object.keys(tokens.color).length : 0,
              typography: tokens.typography ? Object.keys(tokens.typography).length : 0,
              spacing: tokens.space ? Object.keys(tokens.space).length : 0
            }
          };
        } else {
          result.status = 'warning';
          result.validation = {
            fileExists: false,
            message: 'Tokens file not found'
          };
        }
      }
      
      process.stdout.write(JSON.stringify(result, null, 2));
      
    } catch (error) {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exit(1);
    }
  });
}

main();
