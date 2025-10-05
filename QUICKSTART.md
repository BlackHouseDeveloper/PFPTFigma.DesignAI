# Quick Start Guide

Get up and running with FigmaAgentic.NET in 5 minutes.

## Prerequisites

- Node.js >= 20.0.0
- npm or pnpm
- (Optional) .NET SDK 8.0+ for full component development

## Installation

```bash
# Clone the repository
git clone https://github.com/BlackHouseDeveloper/PFPTFigma.DesignAI.git
cd PFPTFigma.DesignAI

# Install dependencies
make restore
# or
npm install
```

## Basic Usage

### 1. Generate Tokens (Mock Mode)

The repository comes with a sample `app.tokens.json` file. Build artifacts from it:

```bash
make tokens.build
```

This generates:
- `artifacts/design-tokens.css`
- `artifacts/design-tokens.xaml`
- `artifacts/design-tokens.json`
- `src/Shared.UI/Styles/Theme.xaml` (with auto-gen header)
- `src/Shared.UI/wwwroot/css/_tokens.css` (with auto-gen header)

### 2. Generate Components

Create Razor components from templates:

```bash
make codegen
```

This generates:
- `src/Shared.UI/Components/LoginForm.razor`
- `src/Shared.UI/Components/IntakeCard.razor`
- `src/Shared.UI/Components/AppointmentsList.razor`

### 3. Run Accessibility Checks

Validate WCAG compliance:

```bash
make test.a11y
```

### 4. Run Agent Orchestration

Execute the multi-agent pipeline:

```bash
make ui.sync
```

This runs: Planner → Tokenizer → Codegen → Reviewer → Integrator

## Working with Figma

### Set up Figma Integration

1. Get your Figma Personal Access Token:
   - Go to Figma → Settings → Account → Personal access tokens
   - Create a new token with read access

2. Get your Figma File Key:
   - Open your Figma file
   - Copy the key from URL: `https://www.figma.com/file/{FILE_KEY}/...`

3. Set environment variables:

```bash
export FIGMA_TOKEN="your_token_here"
export FIGMA_FILE_KEY="your_file_key_here"
```

Or create `.env` file:
```
FIGMA_TOKEN=your_token_here
FIGMA_FILE_KEY=your_file_key_here
```

### Pull Real Tokens from Figma

```bash
make tokens.pull
```

This fetches tokens from Figma and generates `app.tokens.json`.

## Development Workflow

### Typical Development Cycle

```bash
# 1. Pull latest tokens (if working with Figma)
make tokens.pull

# 2. Build artifacts
make tokens.build

# 3. Generate components
make codegen

# 4. Run tests
make test.a11y

# 5. Review changes
git diff src/Shared.UI/

# 6. Commit (only source files, not generated artifacts)
git add src/Shared.UI/Design/tokens/app.tokens.json
git add tools/codegen/templates/
git commit -m "feat: update design tokens"
```

### Editing Components

To modify generated components:

1. Edit templates in `tools/codegen/templates/`
2. Run `make codegen` to regenerate
3. Never edit `.razor` files directly (they'll be overwritten)

### Editing Tokens

To modify design tokens:

1. Edit `src/Shared.UI/Design/tokens/app.tokens.json`
2. Run `make tokens.build` to regenerate XAML/CSS
3. Run `make codegen` to update components with new token values

## Common Commands

```bash
# Show all commands
make help

# Clean generated files
make clean

# Full rebuild
make clean && make tokens.build && make codegen

# Test accessibility
make test.a11y

# Run full pipeline
make ui.sync
```

## Troubleshooting

### "Command not found: make"

On Windows, install `make` via:
- Chocolatey: `choco install make`
- Or use npm scripts directly: `npm run tokens:build`

### "FIGMA_TOKEN not set"

Set environment variables before running `make tokens.pull`:

```bash
export FIGMA_TOKEN="your_token"
export FIGMA_FILE_KEY="your_key"
make tokens.pull
```

### "Style Dictionary build failed"

Ensure you're in the project root and dependencies are installed:

```bash
make restore
make tokens.build
```

### Generated files not updating

Run clean first:

```bash
make clean
make tokens.build
make codegen
```

## Next Steps

- Read [WORKPLAN.md](WORKPLAN.md) for detailed architecture
- Read [README.md](README.md) for full documentation
- Explore [agents/README.md](agents/README.md) for agent system details
- Check `.github/workflows/ui-sync.yml` for CI/CD pipeline

## Getting Help

- Check the [GitHub Issues](https://github.com/BlackHouseDeveloper/PFPTFigma.DesignAI/issues)
- Review the [WORKPLAN.md](WORKPLAN.md) for implementation details
- Read agent documentation in [agents/README.md](agents/README.md)
