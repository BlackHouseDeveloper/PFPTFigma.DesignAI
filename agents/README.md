# Multi-Agent Orchestration System

This directory contains the multi-agent orchestration system for the FigmaAgentic.NET pipeline. All agents follow a strict stdin/stdout JSON contract for swappability.

## Architecture

```
agents/
├── runner/         # Orchestrator (composes agent calls)
├── planner/        # Work plan generator (can use Ollama or OpenAI)
├── tokenizer/      # Token validator (deterministic)
├── codegen/        # Component generator (template-based)
├── reviewer/       # A11y & quality checks (can use Ollama)
└── integrator/     # PR preparation & documentation
```

## Agent Contract

Every agent:
1. Reads JSON input from stdin
2. Performs its task
3. Writes JSON output to stdout
4. Exits with code 0 on success, non-zero on failure

### Example

```bash
echo '{"task":"validate","file":"app.tokens.json"}' | node agents/tokenizer/agent.mjs
```

Output:
```json
{
  "status": "success",
  "agent": "tokenizer",
  "timestamp": "2024-01-15T10:00:00Z",
  "validation": {
    "fileExists": true,
    "hasColors": true,
    "tokenCount": { "colors": 12 }
  }
}
```

## Running the Pipeline

```bash
# Full orchestration
node agents/runner/orchestrate.mjs

# Or via make
make ui.sync
```

## Agent Descriptions

### Planner
- **Purpose**: Analyzes changes and creates work plans
- **Model**: Local LLM (Ollama) by default, OpenAI as fallback
- **Deterministic**: No (uses LLM for intelligent planning)

### Tokenizer
- **Purpose**: Validates token structure and consistency
- **Model**: N/A (deterministic rules)
- **Deterministic**: Yes

### Codegen
- **Purpose**: Generates components from templates
- **Model**: N/A (template-based)
- **Deterministic**: Yes

### Reviewer
- **Purpose**: Runs a11y, contrast, keyboard navigation checks
- **Model**: Local LLM (Ollama) for analysis, deterministic checks
- **Deterministic**: Partially

### Integrator
- **Purpose**: Prepares PR artifacts and documentation
- **Model**: N/A (deterministic)
- **Deterministic**: Yes

## Adding New Agents

1. Create directory: `agents/my-agent/`
2. Create script: `agents/my-agent/agent.mjs`
3. Implement stdin/stdout JSON contract
4. Update `agents/runner/orchestrate.mjs` to call your agent
5. Document in this README

## Cost Optimization

- **Local first**: Use Ollama for Planner and Reviewer
- **Cloud fallback**: Use OpenAI mini tier only when needed
- **Deterministic when possible**: Avoid LLM for predictable tasks

## Future Enhancements

- [ ] Figma Designer agent (write to Figma API)
- [ ] Test Runner agent (bUnit, Playwright)
- [ ] Deployment agent (publish to Azure/AWS)
- [ ] Analytics agent (track design system usage)
