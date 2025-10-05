# PFPT.DesignAI Work Plan

## Overview
This repository automates the design token workflow for PFPT, pulling design tokens from Figma, transforming them into platform-specific formats (XAML, CSS), running accessibility checks, and syncing changes into the main PFPT application.

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

### Scripts
- **figma-pull.mjs**: Fetches design tokens from Figma API
- **build-tokens.mjs**: Uses Style Dictionary to transform tokens into XAML, CSS, and JSON formats
- **a11y-check.mjs**: Validates color contrast ratios and other accessibility requirements

### Workflow
- **ui-sync.yml**: GitHub Actions workflow that orchestrates the token sync process
  - Triggers: Manual dispatch or on schedule
  - Steps: Pull tokens → Build artifacts → Check accessibility → Commit changes

### Artifacts
All generated files are stored in `artifacts/`:
- `design-tokens.css`: CSS custom properties
- `design-tokens.xaml`: WPF/XAML resource dictionary
- `design-tokens.json`: Flat JSON structure for reference

## Workflow Sequence

1. **Token Extraction**: `figma-pull.mjs` calls Figma API and saves raw tokens to `tokens/`
2. **Token Transformation**: `build-tokens.mjs` runs Style Dictionary to generate platform artifacts
3. **Accessibility Validation**: `a11y-check.mjs` validates color contrast and flags issues
4. **Sync to Main Repo**: Changes are committed and can be synced to the main PFPT application repository

## Development Guidelines

- Keep this repository focused on design token automation only
- All business logic belongs in the main PFPT application
- Token schemas should be deterministic and version-controlled
- All CI runs should be idempotent (same input = same output)
- Never commit secrets or tokens to version control

## Future Enhancements

- [ ] Support for typography tokens
- [ ] Support for spacing/sizing tokens
- [ ] Integration with design system documentation
- [ ] Automated PR creation to main PFPT repo
- [ ] Token versioning and changelog generation
