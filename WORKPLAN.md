# FigmaAgentic.NET Work Plan

## Overview
This repository implements a production-grade, token-first, RCL-centric Figma-to-Blazor pipeline with multi-agent orchestration. It automates the design token workflow for PFPT, pulling design tokens from Figma, transforming them into platform-specific formats (XAML, CSS), generating Razor components, running accessibility checks, and syncing changes into the main PFPT application.

## Status: Phase 1-4 Complete ✅

The repository now implements:
- ✅ Token-first architecture with `app.tokens.json` as single source of truth
- ✅ Deterministic token transformation → Theme.xaml + _tokens.css (with auto-gen headers)
- ✅ Template-based component codegen system
- ✅ Multi-agent orchestration with stdin/stdout contracts
- ✅ Three reference components (LoginForm, IntakeCard, AppointmentsList)
- ✅ Makefile CLI for all operations
- ✅ Updated CI/CD pipeline

## Setup Requirements

### GitHub Secrets (Required)
Before running the automation, the following secrets must be configured in GitHub Settings → Secrets and variables → Actions:

- **FIGMA_TOKEN**: Personal Access Token from Figma with read access to design files
- **FIGMA_FILE_KEY**: The file key from the Figma file URL (format: `https://www.figma.com/file/{FILE_KEY}/...`)
- **GH_PAT**: GitHub Personal Access Token with `repo` scope for syncing changes to the main PFPT repository

### Local Development Setup
1. Clone this repository
2. Copy `.env.example` to `.env` (if provided) and fill in your local credentials
3. Run `pnpm install` to install dependencies
4. DO NOT run `pnpm run figma:pull` until secrets are properly configured

## Architecture

### Directory Structure
```
/src/Shared.UI/                   # Razor Class Library (RCL)
  /Components/                    # Generated Razor components
  /Design/tokens/                 # app.tokens.json (source of truth)
  /Styles/                        # Theme.xaml (generated)
  /wwwroot/css/                   # _tokens.css (generated)

/tools/
  /figma-token-build/scripts/     # Token extraction & transformation
  /codegen/                       # Component generators + templates
  /a11y/                          # Accessibility checks

/agents/                          # Multi-agent orchestration
  /planner/                       # Work plan generator
  /tokenizer/                     # Token validator
  /codegen/                       # Component generator agent
  /reviewer/                      # A11y & quality checks
  /integrator/                    # PR preparation
  /runner/                        # Orchestrator
```

### Core Scripts
- **figma-pull.mjs**: Fetches design tokens from Figma API → `app.tokens.json`
- **build-tokens.mjs**: Uses Style Dictionary to transform tokens into XAML, CSS, and JSON formats
- **generate-components.mjs**: Template-based component generation
- **a11y-check.mjs**: Validates color contrast ratios and other accessibility requirements

### CLI Commands (Makefile)
- `make tokens.pull`: Pull Figma variables → app.tokens.json
- `make tokens.build`: Transform tokens → Theme.xaml + _tokens.css
- `make codegen`: Generate/refresh components from templates
- `make test.a11y`: Run accessibility checks
- `make ui.sync`: Full pipeline + PR creation
- `make clean`: Remove generated files

### Workflow
- **ui-sync.yml**: GitHub Actions workflow that orchestrates the full pipeline
  - Triggers: Manual dispatch, on schedule, or push to main
  - Steps: Pull tokens → Build artifacts → Generate components → Check accessibility → Run agents → Commit changes

### Artifacts
Generated files (DO NOT EDIT MANUALLY):
- `artifacts/design-tokens.css`: CSS custom properties (intermediate)
- `artifacts/design-tokens.xaml`: XAML resource dictionary (intermediate)
- `artifacts/design-tokens.json`: Flat JSON structure (intermediate)
- `src/Shared.UI/Styles/Theme.xaml`: Final XAML with auto-gen header
- `src/Shared.UI/wwwroot/css/_tokens.css`: Final CSS with auto-gen header
- `src/Shared.UI/Components/*.razor`: Generated Razor components

## Workflow Sequence

1. **Token Extraction**: `figma-pull.mjs` calls Figma API and saves to `app.tokens.json` (single source of truth)
2. **Token Transformation**: `build-tokens.mjs` runs Style Dictionary to generate XAML/CSS with auto-gen headers
3. **Component Generation**: `generate-components.mjs` creates Razor components from templates using tokens
4. **Accessibility Validation**: `a11y-check.mjs` validates color contrast and flags issues
5. **Agent Orchestration**: Multi-agent system (Planner → Tokenizer → Codegen → Reviewer → Integrator)
6. **Sync to Main Repo**: Changes are committed and can be synced to the main PFPT application repository

## Token Structure (app.tokens.json)

Standardized keys following design system best practices:
- **color**: primary, onPrimary, secondary, onSecondary, surface, onSurface, background, onBackground, success, warning, error, info
- **typography**: display, title, body, caption (fontFamily, fontSize, fontWeight, lineHeight)
- **space**: xs, sm, md, lg, xl (spacing tokens)
- **radius**: sm, md, lg, xl, 2xl (border radius)
- **elevation**: level0-4 (shadow tokens)

## Development Guidelines

### Hard Rules
❌ **Never** edit generated files manually (Theme.xaml, _tokens.css, *.razor components)
❌ **Never** commit secrets or tokens to version control
❌ **Never** add freeform LLM code generation in CI
✅ **Always** use templates for codegen
✅ **Always** validate tokens before using
✅ **Always** run `make test.a11y` before committing

### Principles
- **Single source of truth**: `app.tokens.json` → all generated files
- **Shared first**: Build in Shared.UI/Components, hosts are thin adapters
- **Deterministic**: Template-based, no creative generation
- **Swappable**: Agents use stdin/stdout JSON contracts
- **Cost-aware**: Local LLM (Ollama) by default, cloud as fallback

### Workflow
1. Make changes to templates or token mappings
2. Run `make tokens.build && make codegen`
3. Verify generated files
4. Run `make test.a11y`
5. Commit only source files (not generated artifacts)
6. CI will regenerate artifacts automatically

### Token schemas should be deterministic and version-controlled
- All CI runs should be idempotent (same input = same output)

## Completed Features

- ✅ Support for typography tokens (fontFamily, fontSize, fontWeight, lineHeight)
- ✅ Support for spacing/sizing tokens (xs-xl)
- ✅ Support for radius tokens (sm-2xl)
- ✅ Support for elevation/shadow tokens (level0-4)
- ✅ Multi-agent orchestration system
- ✅ Template-based component generation
- ✅ Reference components (LoginForm, IntakeCard, AppointmentsList)
- ✅ Makefile CLI commands
- ✅ Auto-generated headers on output files

## Future Enhancements

- [ ] .NET projects for Shared.UI, Host.Maui, Host.Web
- [ ] Test infrastructure (xUnit, bUnit, Playwright)
- [ ] Ollama integration for Planner/Reviewer agents
- [ ] Figma Plugin for designer workflow
- [ ] Component screenshot diffing
- [ ] Integration with design system documentation
- [ ] Automated PR creation to main PFPT repo
- [ ] Token versioning and changelog generation
- [ ] StyleCop/Roslynator/XAML analyzers
- [ ] Virtualization performance tests
