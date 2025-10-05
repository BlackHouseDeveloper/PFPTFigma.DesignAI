# FigmaAgentic.NET - Production-Grade Design Automation

**Token-first, RCL-centric Figma-to-Blazor pipeline with multi-agent orchestration**

External automation repo for PFPT UI token management and code generation. Implements a production-grade, deterministic pipeline that pulls Figma design tokens, transforms them into platform-specific artifacts (XAML, CSS), generates Razor components, runs accessibility checks, and syncs changes via CI. Keeps design tooling isolated from core application code.

## Architecture Principles

🎯 **Single Source of Truth**: `app.tokens.json` → all generated files. No manual edits to generated artifacts.

🔀 **Shared First**: Razor Class Library (RCL) at `/src/Shared.UI` for all components. MAUI and Web hosts are thin adapters.

⚡ **Deterministic**: Template-based codegen. No "creative" generation in CI.

🔌 **Swappable Agents**: Each agent is a CLI with stdin/stdout JSON contracts. Orchestrate with a tiny runner.

💰 **Cost-Aware**: Local LLM (Ollama) by default for Planner/Reviewer. Cloud (OpenAI) as fallback.

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm (or npm)
- .NET SDK 8.0+ (for Shared.UI components)
- Environment variables: `FIGMA_TOKEN`, `FIGMA_FILE_KEY`

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd PFPTFigma.DesignAI
make restore
```

### Basic Commands

```bash
make tokens.pull      # Pull design tokens from Figma
make tokens.build     # Generate Theme.xaml + _tokens.css
make codegen          # Generate components from templates
make test             # Run all tests (unit + a11y)
make ui.sync          # Full pipeline + PR creation
```

## Directory Structure

```
/src/Shared.UI/                   # Razor Class Library (RCL)
  /Components/                    # Shared Razor components
  /Design/tokens/                 # app.tokens.json (source of truth)
  /Styles/                        # Theme.xaml (generated)
  /wwwroot/css/                   # _tokens.css (generated)
  
/src/Host.Maui/                   # MAUI host (BlazorWebView)
/src/Host.Web/                    # Blazor WASM host

/tools/
  /figma-token-build/             # Token transformer
  /codegen/                       # Component generators + templates
  /a11y/                          # Accessibility checks

/agents/                          # Multi-agent orchestration
  /planner/                       # Work plan generator
  /tokenizer/                     # Token validator
  /codegen/                       # Component generator agent
  /reviewer/                      # A11y & quality checks
  /integrator/                    # PR preparation
  /runner/                        # Orchestrator

/artifacts/                       # Build outputs
```

## Token Pipeline

1. **Pull**: `figma-pull.mjs` fetches Figma variables → `app.tokens.json`
2. **Transform**: Style Dictionary → `Theme.xaml` + `_tokens.css` (with auto-gen headers)
3. **Validate**: A11y checks ensure WCAG compliance
4. **Generate**: Components built from templates using tokens

### Token Structure

`app.tokens.json` contains standardized keys:

- **color**: primary, onPrimary, surface, onSurface, success, warning, error, info
- **typography**: display, title, body, caption
- **space**: xs, sm, md, lg, xl
- **radius**: sm, md, lg, xl, 2xl
- **elevation**: level0-4

## Multi-Agent System

Agents communicate via stdin/stdout JSON:

```bash
# Example agent call
echo '{"task":"ui-sync"}' | node agents/planner/agent.mjs
```

**Pipeline**: Planner → Tokenizer → Codegen → Reviewer → Integrator

All agents are **swappable** - replace with different models or implementations without changing the orchestrator.

## Reference Components

Three production-ready components prove the stack:

1. **LoginForm**: Full a11y, keyboard navigation, error handling
2. **IntakeCard**: Variants (Compact/Detailed), token-driven styling
3. **AppointmentsList**: Virtualized, keyboard navigable, focus management

## CI/CD Pipeline

`.github/workflows/ui-sync.yml` runs:

1. **Lint**: dotnet format, StyleCop, html-validate
2. **Tokens**: Pull from Figma → transform → validate
3. **Codegen**: Generate components from mappings
4. **Test**: xUnit, bUnit, Playwright, axe a11y
5. **Review**: Summarize diffs + a11y report
6. **Integrate**: Open PR with artifacts

## Development Workflow

### Local Development

```bash
# 1. Pull latest tokens
make tokens.pull

# 2. Build artifacts
make tokens.build

# 3. Generate components
make codegen

# 4. Test locally
make test

# 5. Run Web host (when implemented)
dotnet run --project src/Host.Web
```

### CI Workflow

Push to main triggers automatic sync:
1. Tokens pulled from Figma
2. Artifacts generated
3. Tests run
4. PR created with changes (if any)

## Testing

- **Unit Tests**: xUnit + bUnit for component logic
- **A11y Tests**: axe-core for WCAG 2.1 AA compliance
- **Integration**: Playwright for end-to-end flows
- **Performance**: Virtualization benchmarks for large lists

## Acceptance Criteria

✅ Changing a Figma variable updates only `app.tokens.json`, `Theme.xaml`, `_tokens.css`  
✅ Components render identically on Web + MAUI hosts  
✅ `npm run a11y` passes WCAG 2.1 AA  
✅ No manual edits required after CI codegen  
✅ AppointmentsList handles 1k+ items efficiently  

## Hard Rules

❌ **Never** edit generated files manually (Theme.xaml, _tokens.css)  
❌ **Never** commit secrets or tokens  
❌ **Never** add freeform LLM code generation in CI  
✅ **Always** use templates for codegen  
✅ **Always** validate tokens before using  

## Future Enhancements

- [ ] Figma Plugin for designer workflow
- [ ] Ollama integration for intelligent planning
- [ ] Component screenshot diffing
- [ ] Automated PR to main PFPT repo
- [ ] Token versioning & changelog

## Contributing

This repo follows strict architectural principles. See `WORKPLAN.md` for implementation details.

## License

ISC
