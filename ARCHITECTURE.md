# Architecture Diagram - FigmaAgentic.NET

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FigmaAgentic.NET Pipeline                   │
│                  Token-First, RCL-Centric Design                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    Figma     │  Design Source
│  (Variables) │
└──────┬───────┘
       │
       │ Figma REST API
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Token Extraction (figma-pull.mjs)                               │
│  • Fetches design variables from Figma                           │
│  • Maps to standardized keys                                     │
│  • Outputs: app.tokens.json                                      │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  app.tokens.json     │  ⭐ SINGLE SOURCE OF TRUTH
                │  ──────────────────  │
                │  • color            │
                │  • typography       │
                │  • space            │
                │  • radius           │
                │  • elevation        │
                └──────────┬───────────┘
                           │
           ┌───────────────┼────────────────┐
           │               │                │
           ▼               ▼                ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ Style Dictionary │ │   Codegen    │ │  A11y Check  │
│ (build-tokens)   │ │   (generate  │ │  (validate)  │
│                  │ │   -components)│ │              │
└────────┬─────────┘ └──────┬───────┘ └──────┬───────┘
         │                  │                │
         │                  │                │
         ▼                  ▼                ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ Theme.xaml       │ │ *.razor      │ │ WCAG Report  │
│ _tokens.css      │ │ Components   │ │              │
└──────────────────┘ └──────────────┘ └──────────────┘
         │                  │                │
         └──────────────────┼────────────────┘
                           │
                           ▼
                ┌───────────────────────┐
                │  Multi-Agent System   │
                │  ─────────────────── │
                │  Runner/Orchestrator  │
                └───────┬───────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      │                 │                 │
      ▼                 ▼                 ▼
┌──────────┐      ┌──────────┐     ┌──────────┐
│ Planner  │      │Tokenizer │     │ Codegen  │
│  Agent   │      │  Agent   │     │  Agent   │
└──────────┘      └──────────┘     └──────────┘
      │                 │                 │
      └─────────────────┼─────────────────┘
                        │
                        ▼
                  ┌──────────┐     ┌──────────┐
                  │ Reviewer │     │Integrator│
                  │  Agent   │     │  Agent   │
                  └──────────┘     └──────────┘
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  PR Artifacts   │
                        │  Documentation  │
                        └─────────────────┘
```

## Directory Structure

```
PFPTFigma.DesignAI/
│
├── src/                              # Application code
│   ├── Shared.UI/                    # ⭐ Razor Class Library (RCL)
│   │   ├── Components/               # Generated Razor components
│   │   │   ├── LoginForm.razor
│   │   │   ├── IntakeCard.razor
│   │   │   └── AppointmentsList.razor
│   │   │
│   │   ├── Design/
│   │   │   └── tokens/
│   │   │       ├── app.tokens.json      # ⭐ Source of truth
│   │   │       └── app.tokens.schema.json
│   │   │
│   │   ├── Styles/
│   │   │   └── Theme.xaml            # ⚙️ Generated (DO NOT EDIT)
│   │   │
│   │   └── wwwroot/
│   │       └── css/
│   │           └── _tokens.css       # ⚙️ Generated (DO NOT EDIT)
│   │
│   ├── Host.Maui/                    # MAUI host (stub)
│   └── Host.Web/                     # Blazor WASM host (stub)
│
├── tools/                            # Build & generation tools
│   ├── figma-token-build/
│   │   └── scripts/
│   │       ├── figma-pull.mjs        # Figma → app.tokens.json
│   │       └── build-tokens.mjs      # Tokens → XAML/CSS
│   │
│   ├── codegen/
│   │   ├── generate-components.mjs   # Template → Components
│   │   └── templates/
│   │       ├── LoginForm.template
│   │       ├── IntakeCard.template
│   │       └── AppointmentsList.template
│   │
│   └── a11y/
│       └── a11y-check.mjs            # WCAG validation
│
├── agents/                           # Multi-agent orchestration
│   ├── planner/
│   │   └── agent.mjs                 # Work plan generator
│   ├── tokenizer/
│   │   └── agent.mjs                 # Token validator
│   ├── codegen/
│   │   └── agent.mjs                 # Component generator
│   ├── reviewer/
│   │   └── agent.mjs                 # A11y & quality checks
│   ├── integrator/
│   │   └── agent.mjs                 # PR preparation
│   └── runner/
│       └── orchestrate.mjs           # ⭐ Orchestrator
│
├── artifacts/                        # Build outputs (intermediate)
│   ├── design-tokens.css
│   ├── design-tokens.xaml
│   └── design-tokens.json
│
├── .github/workflows/
│   └── ui-sync.yml                   # CI/CD pipeline
│
├── Makefile                          # ⭐ CLI commands
├── style-dictionary.config.mjs       # Style Dictionary config
├── package.json                      # Node.js dependencies
│
└── Documentation/
    ├── README.md                     # Architecture overview
    ├── QUICKSTART.md                 # Getting started guide
    ├── WORKPLAN.md                   # Implementation plan
    ├── IMPLEMENTATION_SUMMARY.md     # Achievement log
    └── ARCHITECTURE.md               # This file
```

## Data Flow

### 1. Token Extraction Flow
```
Figma Variables
      ↓ (Figma REST API)
figma-pull.mjs
      ↓ (standardize & map)
app.tokens.json
   {
     color: { primary: "#007AFF", ... },
     typography: { body: {...}, ... },
     space: { md: "16px", ... },
     ...
   }
```

### 2. Token Transformation Flow
```
app.tokens.json
      ↓
Style Dictionary
      ↓
  ┌───┴───┐
  │       │
  ▼       ▼
Theme.xaml  _tokens.css
```

### 3. Component Generation Flow
```
app.tokens.json + Templates
      ↓
generate-components.mjs
      ↓ (token substitution)
LoginForm.razor
IntakeCard.razor
AppointmentsList.razor
```

### 4. Multi-Agent Flow
```
User/CI Trigger
      ↓
  Orchestrator (runner)
      ↓
  ┌───┼───┐
  ▼   ▼   ▼
Planner → Tokenizer → Codegen → Reviewer → Integrator
  │         │           │          │           │
  │         │           │          │           │
  └─────────┴───────────┴──────────┴───────────┘
                        │
                        ▼
                   PR Ready
```

## Agent Communication Protocol

All agents use stdin/stdout JSON:

```javascript
// Input (stdin)
{
  "task": "validate",
  "context": {...}
}

// Output (stdout)
{
  "status": "success",
  "agent": "tokenizer",
  "timestamp": "2024-01-15T10:00:00Z",
  "result": {...}
}
```

## Token Schema

```json
{
  "$schema": "./app.tokens.schema.json",
  "_comment": "AUTO-GENERATED - DO NOT EDIT",
  "_generated": "2024-01-15T10:00:00Z",
  
  "color": {
    "primary": { "value": "#007AFF", "type": "color" },
    "onPrimary": { "value": "#FFFFFF", "type": "color" },
    ...
  },
  
  "typography": {
    "display": {
      "fontFamily": "system-ui",
      "fontSize": "32px",
      "fontWeight": "700",
      "lineHeight": "40px",
      "type": "typography"
    },
    ...
  },
  
  "space": {
    "xs": { "value": "4px", "type": "spacing" },
    "sm": { "value": "8px", "type": "spacing" },
    ...
  },
  
  "radius": {
    "sm": { "value": "4px", "type": "borderRadius" },
    ...
  },
  
  "elevation": {
    "level1": { "value": "0 1px 3px rgba(0,0,0,0.12)", "type": "shadow" },
    ...
  }
}
```

## CLI Commands (Makefile)

```bash
# Token workflow
make tokens.pull      # Figma → app.tokens.json
make tokens.build     # app.tokens.json → XAML/CSS

# Component workflow
make codegen          # Templates + tokens → Components

# Quality checks
make test.a11y        # WCAG validation
make test.bunit       # Component tests

# Full pipeline
make ui.sync          # Complete pipeline + PR

# Utilities
make clean            # Remove generated files
make restore          # Install dependencies
make help             # Show all commands
```

## CI/CD Pipeline (.github/workflows/ui-sync.yml)

```yaml
Trigger: push | schedule | manual
   ↓
1. Checkout & setup
   ↓
2. Install dependencies
   ↓
3. Pull tokens (figma:pull)
   ↓
4. Build tokens (tokens:build)
   ↓
5. Generate components (codegen)
   ↓
6. Run a11y checks (a11y:check)
   ↓
7. Run agent orchestration
   ↓
8. Commit changes
   ↓
9. Upload artifacts
```

## Key Design Principles

### 1. Single Source of Truth
- **app.tokens.json** is authoritative
- All generated files derive from it
- Never edit generated files manually

### 2. Deterministic Generation
- Template-based (no LLM creativity in CI)
- Same input → same output
- Reproducible builds

### 3. Swappable Agents
- stdin/stdout JSON contracts
- Process-local execution
- Easy to replace implementations

### 4. Cost-Aware
- Local LLM (Ollama) preferred
- Cloud (OpenAI) as fallback
- Deterministic where possible

### 5. Shared First
- RCL for all components
- Hosts are thin adapters
- Cross-platform by default

## File Generation Headers

All generated files include provenance:

```xml
<!-- Theme.xaml -->
<!--
  AUTO-GENERATED from /src/Shared.UI/Design/tokens/app.tokens.json
  DO NOT EDIT THIS FILE MANUALLY
  Generated: 2024-01-15T10:00:00.000Z
-->
```

```css
/* _tokens.css */
/*
 * AUTO-GENERATED from /src/Shared.UI/Design/tokens/app.tokens.json
 * DO NOT EDIT THIS FILE MANUALLY
 * Generated: 2024-01-15T10:00:00.000Z
 */
```

```razor
@* Component.razor *@
@* AUTO-GENERATED Component - Edit template, not this file *@
```

## Security & Best Practices

1. ❌ Never commit `FIGMA_TOKEN` or secrets
2. ❌ Never edit generated files manually
3. ✅ Always use `make` commands for operations
4. ✅ Always run `make test.a11y` before committing
5. ✅ Always version control only source files

## Extension Points

### Adding New Tokens
1. Update Figma variables
2. Run `make tokens.pull`
3. Verify `app.tokens.json`
4. Run `make tokens.build`

### Adding New Components
1. Create template in `tools/codegen/templates/`
2. Update `generate-components.mjs`
3. Run `make codegen`

### Adding New Agents
1. Create `agents/my-agent/agent.mjs`
2. Implement stdin/stdout contract
3. Update `agents/runner/orchestrate.mjs`
4. Document in `agents/README.md`

## Performance Considerations

- **Token builds**: < 5 seconds
- **Component generation**: < 2 seconds
- **A11y checks**: < 3 seconds
- **Full pipeline**: < 15 seconds

## Future Architecture

```
┌─────────────────────────────────────────────────┐
│  Future Enhancements (Not Yet Implemented)      │
├─────────────────────────────────────────────────┤
│  • .NET Projects (Shared.UI, Hosts)             │
│  • Ollama Integration (Planner/Reviewer)        │
│  • Figma Plugin (Designer Workflow)             │
│  • Screenshot Diffing (Visual Regression)       │
│  • Automated PR Creation (to main PFPT repo)    │
│  • Test Infrastructure (xUnit, bUnit, Playwright)│
│  • StyleCop/Roslynator (Quality Gates)          │
└─────────────────────────────────────────────────┘
```
