# FigmaAgentic.NET - Production-grade Figma to Blazor pipeline
# Makefile for deterministic, token-first design automation

.PHONY: help restore tokens.pull tokens.build codegen test test.a11y test.bunit ui.sync clean

# Default target
help:
	@echo "FigmaAgentic.NET - Available commands:"
	@echo ""
	@echo "  make restore        - Install dependencies (npm + dotnet)"
	@echo "  make tokens.pull    - Pull Figma variables to app.tokens.json"
	@echo "  make tokens.build   - Transform tokens → Theme.xaml + _tokens.css"
	@echo "  make codegen        - Generate/refresh components from mappings"
	@echo "  make test           - Run all tests (unit + render + a11y)"
	@echo "  make test.a11y      - Run accessibility tests only"
	@echo "  make test.bunit     - Run component tests only"
	@echo "  make ui.sync        - Full pipeline + PR creation"
	@echo "  make clean          - Remove generated files and artifacts"
	@echo ""

# Restore all dependencies
restore:
	@echo "📦 Installing Node.js dependencies..."
	@pnpm install --frozen-lockfile || npm ci
	@echo "📦 Restoring .NET dependencies..."
	@if [ -f "src/Shared.UI/Shared.UI.csproj" ]; then \
		dotnet restore src/Shared.UI/Shared.UI.csproj; \
	fi
	@if [ -f "src/Host.Maui/Host.Maui.csproj" ]; then \
		dotnet restore src/Host.Maui/Host.Maui.csproj; \
	fi
	@if [ -f "src/Host.Web/Host.Web.csproj" ]; then \
		dotnet restore src/Host.Web/Host.Web.csproj; \
	fi
	@echo "✅ All dependencies restored"

# Pull tokens from Figma
tokens.pull:
	@echo "🔍 Pulling design tokens from Figma..."
	@if [ -z "$$FIGMA_TOKEN" ] || [ -z "$$FIGMA_FILE_KEY" ]; then \
		echo "❌ Error: FIGMA_TOKEN and FIGMA_FILE_KEY must be set"; \
		exit 1; \
	fi
	@node tools/figma-token-build/scripts/figma-pull.mjs
	@echo "✅ Tokens pulled successfully"

# Build tokens into platform-specific artifacts
tokens.build:
	@echo "🔨 Building design tokens..."
	@node tools/figma-token-build/scripts/build-tokens.mjs
	@echo "✅ Tokens built successfully"

# Generate components from templates
codegen:
	@echo "🔧 Running code generation..."
	@node tools/codegen/generate-components.mjs
	@echo "✅ Code generation completed"

# Run all tests
test: test.bunit test.a11y
	@echo "✅ All tests passed"

# Run accessibility tests
test.a11y:
	@echo "♿ Running accessibility checks..."
	@node tools/a11y/axe-check.mjs
	@echo "✅ Accessibility checks passed"

# Run component unit tests
test.bunit:
	@echo "🧪 Running component tests..."
	@if [ -f "tests/Shared.UI.Tests/Shared.UI.Tests.csproj" ]; then \
		dotnet test tests/Shared.UI.Tests/Shared.UI.Tests.csproj; \
	else \
		echo "ℹ️  No test project found yet"; \
	fi

# Full UI sync pipeline
ui.sync: tokens.pull tokens.build codegen test
	@echo "🚀 Running full UI sync pipeline..."
	@node agents/runner/orchestrate.mjs
	@echo "✅ UI sync completed"

# Clean generated artifacts
clean:
	@echo "🧹 Cleaning generated files..."
	@rm -rf artifacts/*.css artifacts/*.xaml artifacts/*.json
	@rm -rf src/Shared.UI/Styles/Theme.xaml
	@rm -rf src/Shared.UI/wwwroot/css/_tokens.css
	@rm -rf node_modules/.cache
	@echo "✅ Clean completed"
