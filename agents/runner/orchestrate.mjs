#!/usr/bin/env node

/**
 * orchestrate.mjs
 * Multi-agent orchestration runner
 * Coordinates: Planner → Tokenizer → Codegen → Reviewer → Integrator
 * All agents use stdin/stdout JSON contracts for swappability
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENTS_DIR = path.join(__dirname, '..');

/**
 * Run an agent with JSON input/output
 */
async function runAgent(agentName, input) {
  return new Promise((resolve, reject) => {
    const agentPath = path.join(AGENTS_DIR, agentName, 'agent.mjs');
    
    if (!fs.existsSync(agentPath)) {
      console.log(`ℹ️  Agent ${agentName} not implemented yet, skipping...`);
      resolve({ skipped: true, agent: agentName });
      return;
    }
    
    const agent = spawn('node', [agentPath], {
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    let output = '';
    
    agent.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    agent.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Agent ${agentName} exited with code ${code}`));
        return;
      }
      
      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (e) {
        reject(new Error(`Agent ${agentName} produced invalid JSON: ${output}`));
      }
    });
    
    // Write input as JSON to stdin
    agent.stdin.write(JSON.stringify(input));
    agent.stdin.end();
  });
}

/**
 * Main orchestration
 */
async function main() {
  console.log('🚀 Starting multi-agent UI sync orchestration...\n');
  
  try {
    // Step 1: Planner - Analyze changes and create work plan
    console.log('📋 Step 1: Running Planner agent...');
    const plannerInput = {
      task: 'ui-sync',
      context: 'Full UI sync pipeline',
      timestamp: new Date().toISOString()
    };
    const plan = await runAgent('planner', plannerInput);
    console.log('✅ Planner completed\n');
    
    // Step 2: Tokenizer - Already done by tokens.pull, just validate
    console.log('🎨 Step 2: Running Tokenizer agent...');
    const tokenizerInput = {
      action: 'validate',
      tokensPath: path.join(__dirname, '..', '..', 'src', 'Shared.UI', 'Design', 'tokens', 'app.tokens.json')
    };
    const tokenizerResult = await runAgent('tokenizer', tokenizerInput);
    console.log('✅ Tokenizer completed\n');
    
    // Step 3: Codegen - Generate components
    console.log('🔧 Step 3: Running Codegen agent...');
    const codegenInput = {
      action: 'generate',
      templates: ['LoginForm', 'IntakeCard', 'AppointmentsList']
    };
    const codegenResult = await runAgent('codegen', codegenInput);
    console.log('✅ Codegen completed\n');
    
    // Step 4: Reviewer - Run a11y and quality checks
    console.log('♿ Step 4: Running Reviewer agent...');
    const reviewerInput = {
      checks: ['a11y', 'contrast', 'keyboard'],
      mode: 'AA'
    };
    const reviewerResult = await runAgent('reviewer', reviewerInput);
    console.log('✅ Reviewer completed\n');
    
    // Step 5: Integrator - Prepare PR artifacts
    console.log('📦 Step 5: Running Integrator agent...');
    const integratorInput = {
      action: 'prepare-pr',
      artifacts: {
        plan,
        tokenizerResult,
        codegenResult,
        reviewerResult
      }
    };
    const integratorResult = await runAgent('integrator', integratorInput);
    console.log('✅ Integrator completed\n');
    
    console.log('✨ Multi-agent orchestration completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Planner: ${plan.skipped ? 'Skipped' : 'OK'}`);
    console.log(`  - Tokenizer: ${tokenizerResult.skipped ? 'Skipped' : 'OK'}`);
    console.log(`  - Codegen: ${codegenResult.skipped ? 'Skipped' : 'OK'}`);
    console.log(`  - Reviewer: ${reviewerResult.skipped ? 'Skipped' : 'OK'}`);
    console.log(`  - Integrator: ${integratorResult.skipped ? 'Skipped' : 'OK'}`);
    
  } catch (error) {
    console.error('\n❌ Orchestration failed:', error.message);
    process.exit(1);
  }
}

main();
