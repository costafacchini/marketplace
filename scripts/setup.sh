#!/usr/bin/env bash
# Do not enable `set -e` here: detection intentionally relies on grep/find
# returning exit code 1 when a file, framework, or pattern is simply absent.
set -o pipefail

# =============================================================================
# AI Dev Framework — Modular Setup
#
# Usage:
#   scripts/setup.sh                              # Interactive profile picker
#   scripts/setup.sh --profile standard           # Preset profile
#   scripts/setup.sh --components core,kb,agents   # Custom selection
#   scripts/setup.sh --add plans                  # Add to existing install
#   scripts/setup.sh --remove ci                  # Remove component
#   scripts/setup.sh --dry-run --profile full     # Preview without writing
#   scripts/setup.sh --list                       # Show components & profiles
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_VERSION="$(tr -d '[:space:]' < "$SCRIPT_DIR/../VERSION" 2>/dev/null || echo "unknown")"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR=""
COMPONENTS_DIR="$SCRIPT_DIR/../components"
KNOWLEDGE_PACKS_DIR="$SCRIPT_DIR/knowledge-packs"
INSTALLED_FILE="$REPO_ROOT/.agents/.installed-components"

# --- Colors ---
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'
BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; }

# --- Parse arguments ---
MODE=""
PROFILE=""
COMPONENTS_ARG=""
ADD_COMPONENT=""
REMOVE_COMPONENT=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)    MODE="profile"; PROFILE="$2"; shift 2 ;;
    --components) MODE="custom"; COMPONENTS_ARG="$2"; shift 2 ;;
    --add)        MODE="add"; ADD_COMPONENT="$2"; shift 2 ;;
    --remove)     MODE="remove"; REMOVE_COMPONENT="$2"; shift 2 ;;
    --target)     TARGET_DIR="$2"; shift 2 ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --list)       MODE="list"; shift ;;
    --help|-h)    MODE="help"; shift ;;
    *)            err "Unknown option: $1"; exit 1 ;;
  esac
done

# Override REPO_ROOT if --target was given
if [ -n "$TARGET_DIR" ]; then
  REPO_ROOT="$(cd "$TARGET_DIR" && pwd)" || { echo "[ERR] --target path not found: $TARGET_DIR"; exit 1; }
fi

# --- Load profiles ---
source "$COMPONENTS_DIR/profiles.sh"

# =============================================================================
# DETECTION LAYER (same as before, extracted into functions)
# =============================================================================

LANGUAGES=(); FRAMEWORKS=(); PACKAGE_MANAGERS=(); TEST_RUNNERS=()
LINTERS=(); DATABASES=(); CI_SYSTEMS=()
PROJECT_NAME=""; MAIN_BRANCH=""; ARCHITECTURE=""
HAS_FRONTEND=false; HAS_BACKEND=false; IS_MONOREPO=false

detect_all() {
  detect_project_name
  detect_git
  detect_languages
  detect_frameworks
  detect_package_managers
  detect_test_runners
  detect_linters
  detect_databases
  detect_ci
  detect_architecture
}

detect_project_name() {
  for f in package.json Cargo.toml pyproject.toml; do
    if [ -f "$REPO_ROOT/$f" ]; then
      PROJECT_NAME=$(grep -m1 '"name"\|^name' "$REPO_ROOT/$f" 2>/dev/null | sed 's/.*[":] *"\{0,1\}\([^"]*\)"\{0,1\}.*/\1/' || true)
      [ -n "$PROJECT_NAME" ] && return
    fi
  done
  PROJECT_NAME=$(basename "$REPO_ROOT")
}

detect_git() {
  if [ -d "$REPO_ROOT/.git" ]; then
    MAIN_BRANCH=$(git -C "$REPO_ROOT" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || true)
    if [ -z "$MAIN_BRANCH" ]; then
      for branch in main master develop; do
        if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
          MAIN_BRANCH="$branch"; break
        fi
      done
    fi
  fi
  [ -z "$MAIN_BRANCH" ] && MAIN_BRANCH="main"
}

detect_languages() {
  [ -f "$REPO_ROOT/Gemfile" ] && LANGUAGES+=("Ruby")
  if [ -f "$REPO_ROOT/package.json" ] || [ -f "$REPO_ROOT/yarn.lock" ] || [ -f "$REPO_ROOT/pnpm-lock.yaml" ]; then
    if [ -f "$REPO_ROOT/tsconfig.json" ] || [ -n "$(find "$REPO_ROOT" -maxdepth 3 \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | head -1)" ]; then
      LANGUAGES+=("TypeScript")
    else
      LANGUAGES+=("JavaScript")
    fi
  fi
  if [ -f "$REPO_ROOT/requirements.txt" ] || [ -f "$REPO_ROOT/pyproject.toml" ] || [ -f "$REPO_ROOT/setup.py" ] || [ -f "$REPO_ROOT/Pipfile" ]; then
    LANGUAGES+=("Python")
  fi
  [ -f "$REPO_ROOT/go.mod" ] && LANGUAGES+=("Go")
  [ -f "$REPO_ROOT/Cargo.toml" ] && LANGUAGES+=("Rust")
  ([ -f "$REPO_ROOT/pom.xml" ] || [ -f "$REPO_ROOT/build.gradle" ] || [ -f "$REPO_ROOT/build.gradle.kts" ]) && LANGUAGES+=("Java/Kotlin")
  [ -f "$REPO_ROOT/composer.json" ] && LANGUAGES+=("PHP")
  if [ -f "$REPO_ROOT/Package.swift" ] || [ -n "$(find "$REPO_ROOT" -maxdepth 2 -name "*.xcodeproj" 2>/dev/null | head -1)" ]; then
    LANGUAGES+=("Swift")
  fi
  [ -f "$REPO_ROOT/mix.exs" ] && LANGUAGES+=("Elixir")
  if [ -n "$(find "$REPO_ROOT" -maxdepth 2 \( -name "*.csproj" -o -name "*.sln" \) 2>/dev/null | head -1)" ]; then
    LANGUAGES+=("C#")
  fi
}

detect_frameworks() {
  if [[ " ${LANGUAGES[*]} " =~ " Ruby " ]]; then
    grep -q "rails" "$REPO_ROOT/Gemfile" 2>/dev/null && FRAMEWORKS+=("Rails")
    grep -q "sinatra" "$REPO_ROOT/Gemfile" 2>/dev/null && FRAMEWORKS+=("Sinatra")
  fi
  if [ -f "$REPO_ROOT/package.json" ]; then
    local pkg="$REPO_ROOT/package.json"
    grep -q '"next"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Next.js")
    grep -q '"react"' "$pkg" 2>/dev/null && ! [[ " ${FRAMEWORKS[*]} " =~ " Next.js " ]] && FRAMEWORKS+=("React")
    grep -q '"vue"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Vue")
    grep -q '"svelte"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Svelte")
    grep -q '"@angular/core"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Angular")
    grep -q '"express"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Express")
    grep -q '"fastify"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Fastify")
    grep -q '"@nestjs/core"' "$pkg" 2>/dev/null && FRAMEWORKS+=("NestJS")
    grep -q '"hono"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Hono")
    grep -q '"nuxt"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Nuxt")
    grep -q '"remix"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Remix")
    grep -q '"astro"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Astro")
    grep -q '"react-native"' "$pkg" 2>/dev/null && FRAMEWORKS+=("React Native")
    grep -q '"expo"' "$pkg" 2>/dev/null && FRAMEWORKS+=("Expo")
  fi
  if [[ " ${LANGUAGES[*]} " =~ " Python " ]]; then
    for pf in "$REPO_ROOT/requirements.txt" "$REPO_ROOT/pyproject.toml" "$REPO_ROOT/Pipfile"; do
      [ -f "$pf" ] || continue
      grep -qi "django" "$pf" 2>/dev/null && FRAMEWORKS+=("Django") && break
      grep -qi "flask" "$pf" 2>/dev/null && FRAMEWORKS+=("Flask") && break
      grep -qi "fastapi" "$pf" 2>/dev/null && FRAMEWORKS+=("FastAPI") && break
    done
  fi
  if [[ " ${LANGUAGES[*]} " =~ " Go " ]]; then
    grep -q "gin-gonic" "$REPO_ROOT/go.mod" 2>/dev/null && FRAMEWORKS+=("Gin")
    grep -q "labstack/echo" "$REPO_ROOT/go.mod" 2>/dev/null && FRAMEWORKS+=("Echo")
    grep -q "gofiber" "$REPO_ROOT/go.mod" 2>/dev/null && FRAMEWORKS+=("Fiber")
  fi
  if [[ " ${LANGUAGES[*]} " =~ " PHP " ]]; then
    grep -q "laravel" "$REPO_ROOT/composer.json" 2>/dev/null && FRAMEWORKS+=("Laravel")
    grep -q "symfony" "$REPO_ROOT/composer.json" 2>/dev/null && FRAMEWORKS+=("Symfony")
  fi
  if [[ " ${LANGUAGES[*]} " =~ " Elixir " ]]; then
    grep -q "phoenix" "$REPO_ROOT/mix.exs" 2>/dev/null && FRAMEWORKS+=("Phoenix")
  fi
  if [[ " ${LANGUAGES[*]} " =~ " Rust " ]]; then
    grep -q "actix-web" "$REPO_ROOT/Cargo.toml" 2>/dev/null && FRAMEWORKS+=("Actix")
    grep -q "axum" "$REPO_ROOT/Cargo.toml" 2>/dev/null && FRAMEWORKS+=("Axum")
  fi
}

detect_package_managers() {
  [ -f "$REPO_ROOT/yarn.lock" ] && PACKAGE_MANAGERS+=("yarn")
  [ -f "$REPO_ROOT/pnpm-lock.yaml" ] && PACKAGE_MANAGERS+=("pnpm")
  [ -f "$REPO_ROOT/package-lock.json" ] && PACKAGE_MANAGERS+=("npm")
  [ -f "$REPO_ROOT/bun.lockb" ] && PACKAGE_MANAGERS+=("bun")
  [ -f "$REPO_ROOT/Gemfile.lock" ] && PACKAGE_MANAGERS+=("bundler")
  [ -f "$REPO_ROOT/Pipfile.lock" ] && PACKAGE_MANAGERS+=("pipenv")
  [ -f "$REPO_ROOT/poetry.lock" ] && PACKAGE_MANAGERS+=("poetry")
  [ -f "$REPO_ROOT/Cargo.lock" ] && PACKAGE_MANAGERS+=("cargo")
  [ -f "$REPO_ROOT/go.sum" ] && PACKAGE_MANAGERS+=("go modules")
  [ -f "$REPO_ROOT/composer.lock" ] && PACKAGE_MANAGERS+=("composer")
  [ -f "$REPO_ROOT/mix.lock" ] && PACKAGE_MANAGERS+=("mix")
}

detect_test_runners() {
  if [ -f "$REPO_ROOT/package.json" ]; then
    local pkg="$REPO_ROOT/package.json"
    grep -q '"vitest"' "$pkg" 2>/dev/null && TEST_RUNNERS+=("vitest")
    grep -q '"jest"' "$pkg" 2>/dev/null && TEST_RUNNERS+=("jest")
    grep -q '"mocha"' "$pkg" 2>/dev/null && TEST_RUNNERS+=("mocha")
    grep -q '"playwright"' "$pkg" 2>/dev/null && TEST_RUNNERS+=("playwright")
    grep -q '"cypress"' "$pkg" 2>/dev/null && TEST_RUNNERS+=("cypress")
  fi
  grep -q "rspec" "$REPO_ROOT/Gemfile" 2>/dev/null && TEST_RUNNERS+=("rspec")
  grep -q "minitest" "$REPO_ROOT/Gemfile" 2>/dev/null && TEST_RUNNERS+=("minitest")
  for pf in "$REPO_ROOT/requirements.txt" "$REPO_ROOT/pyproject.toml"; do
    [ -f "$pf" ] && grep -qi "pytest" "$pf" 2>/dev/null && TEST_RUNNERS+=("pytest") && break
  done
  [[ " ${LANGUAGES[*]} " =~ " Go " ]] && TEST_RUNNERS+=("go test")
  [[ " ${LANGUAGES[*]} " =~ " Rust " ]] && TEST_RUNNERS+=("cargo test")
  [[ " ${LANGUAGES[*]} " =~ " Elixir " ]] && TEST_RUNNERS+=("mix test")
  grep -q "phpunit" "$REPO_ROOT/composer.json" 2>/dev/null && TEST_RUNNERS+=("phpunit")
}

detect_linters() {
  for f in .eslintrc.js .eslintrc.json .eslintrc.yml eslint.config.js eslint.config.mjs; do
    [ -f "$REPO_ROOT/$f" ] && LINTERS+=("eslint") && break
  done
  [ -f "$REPO_ROOT/.prettierrc" ] || [ -f "$REPO_ROOT/prettier.config.js" ] && LINTERS+=("prettier")
  [ -f "$REPO_ROOT/biome.json" ] && LINTERS+=("biome")
  [ -f "$REPO_ROOT/.rubocop.yml" ] && LINTERS+=("rubocop")
  [ -f "$REPO_ROOT/pyproject.toml" ] && grep -q "ruff" "$REPO_ROOT/pyproject.toml" 2>/dev/null && LINTERS+=("ruff")
  [[ " ${LANGUAGES[*]} " =~ " Go " ]] && LINTERS+=("go vet")
  [[ " ${LANGUAGES[*]} " =~ " Rust " ]] && LINTERS+=("clippy")
}

detect_databases() {
  for f in docker-compose.yml docker-compose.yaml .env.example config/database.yml; do
    [ -f "$REPO_ROOT/$f" ] || continue
    grep -qi "postgres" "$REPO_ROOT/$f" 2>/dev/null && DATABASES+=("PostgreSQL") && return
    grep -qi "mysql\|mariadb" "$REPO_ROOT/$f" 2>/dev/null && DATABASES+=("MySQL") && return
  done
  if [ -n "$(find "$REPO_ROOT" -maxdepth 2 \( -name "*.sqlite3" -o -name "*.db" \) 2>/dev/null | head -1)" ]; then
    DATABASES+=("SQLite")
  fi
}

detect_ci() {
  [ -d "$REPO_ROOT/.github/workflows" ] && CI_SYSTEMS+=("GitHub Actions")
  [ -f "$REPO_ROOT/.gitlab-ci.yml" ] && CI_SYSTEMS+=("GitLab CI")
  [ -f "$REPO_ROOT/.circleci/config.yml" ] && CI_SYSTEMS+=("CircleCI")
}

detect_architecture() {
  if [ -f "$REPO_ROOT/pnpm-workspace.yaml" ] || [ -f "$REPO_ROOT/lerna.json" ]; then
    IS_MONOREPO=true; ARCHITECTURE="Monorepo"
  elif [ -f "$REPO_ROOT/package.json" ] && grep -q '"workspaces"' "$REPO_ROOT/package.json" 2>/dev/null; then
    IS_MONOREPO=true; ARCHITECTURE="Monorepo"
  fi
  [ -d "$REPO_ROOT/frontend" ] || [ -d "$REPO_ROOT/client" ] || [ -d "$REPO_ROOT/app/javascript" ] && HAS_FRONTEND=true
  [ -d "$REPO_ROOT/backend" ] || [ -d "$REPO_ROOT/server" ] || [ -d "$REPO_ROOT/app/controllers" ] && HAS_BACKEND=true
  if [ -z "$ARCHITECTURE" ]; then
    $HAS_FRONTEND && $HAS_BACKEND && ARCHITECTURE="Full-stack monolith" && return
    $HAS_FRONTEND && ARCHITECTURE="Frontend SPA" && return
    $HAS_BACKEND && ARCHITECTURE="Backend API" && return
    ARCHITECTURE="Single-purpose"
  fi
}

detect_deployment() {
  [ -f "$REPO_ROOT/Procfile" ] && echo "Heroku" && return
  [ -f "$REPO_ROOT/fly.toml" ] && echo "Fly.io" && return
  [ -f "$REPO_ROOT/vercel.json" ] && echo "Vercel" && return
  [ -f "$REPO_ROOT/netlify.toml" ] && echo "Netlify" && return
  [ -f "$REPO_ROOT/Dockerfile" ] && echo "Docker" && return
  echo "Unknown"
}

join_array() { local IFS="$1"; shift; echo "$*"; }

# =============================================================================
# COMMAND BUILDERS
# =============================================================================

build_test_cmd() {
  [ ${#TEST_RUNNERS[@]} -eq 0 ] && echo "# [test command]" && return
  case "${TEST_RUNNERS[0]}" in
    vitest) echo "npx vitest" ;; jest) echo "npx jest" ;; rspec) echo "bundle exec rspec" ;;
    minitest) echo "bundle exec rails test" ;; pytest) echo "pytest" ;;
    "go test") echo "go test ./..." ;; "cargo test") echo "cargo test" ;;
    "mix test") echo "mix test" ;; phpunit) echo "vendor/bin/phpunit" ;;
    *) echo "# ${TEST_RUNNERS[0]}" ;; esac
}

build_lint_cmd() {
  [ ${#LINTERS[@]} -eq 0 ] && echo "# [lint command]" && return
  case "${LINTERS[0]}" in
    eslint) echo "npx eslint ." ;; biome) echo "npx biome check ." ;;
    rubocop) echo "bundle exec rubocop" ;; ruff) echo "ruff check ." ;;
    "go vet") echo "go vet ./..." ;; clippy) echo "cargo clippy" ;;
    *) echo "# ${LINTERS[0]}" ;; esac
}

build_dev_cmd() {
  if [ -f "$REPO_ROOT/package.json" ] && grep -q '"dev"' "$REPO_ROOT/package.json" 2>/dev/null; then
    local pm="${PACKAGE_MANAGERS[0]:-npm}"
    case "$pm" in yarn|pnpm|bun) echo "$pm run dev" ;; *) echo "npm run dev" ;; esac
    return
  fi
  for fw in "${FRAMEWORKS[@]}"; do
    case "$fw" in
      Rails) echo "bin/rails server" && return ;; Django) echo "python manage.py runserver" && return ;;
      Flask) echo "flask run" && return ;; FastAPI) echo "uvicorn main:app --reload" && return ;;
      Phoenix) echo "mix phx.server" && return ;; Laravel) echo "php artisan serve" && return ;;
    esac
  done
  echo "# [dev command]"
}

# =============================================================================
# DEPENDENCY RESOLVER
# =============================================================================

resolve_deps() {
  local requested=("$@")
  local resolved=()
  local seen=()

  resolve_one() {
    local comp="$1"
    [[ " ${seen[*]} " =~ " $comp " ]] && return
    seen+=("$comp")

    local manifest="$COMPONENTS_DIR/$comp/manifest.sh"
    if [ -f "$manifest" ]; then
      source "$manifest"
      for dep in $COMPONENT_DEPS; do
        [ -n "$dep" ] && resolve_one "$dep"
      done
    fi
    resolved+=("$comp")
  }

  for comp in "${requested[@]}"; do
    resolve_one "$comp"
  done

  echo "${resolved[@]}"
}

# =============================================================================
# INSTALLERS (per component)
# =============================================================================

install_core() {
  local deployment fw_str pkg_str db_str
  deployment=$(detect_deployment)
  fw_str=$(join_array ", " "${FRAMEWORKS[@]}")
  [ -z "$fw_str" ] && fw_str=$(join_array ", " "${LANGUAGES[@]}")
  pkg_str=$(join_array ", " "${PACKAGE_MANAGERS[@]}")
  db_str=$(join_array ", " "${DATABASES[@]}")
  [ -z "$db_str" ] && db_str="—"

  # Generate AGENTS.md dynamically based on installed components
  generate_agents_md > "$REPO_ROOT/AGENTS.md"
  ok "Generated AGENTS.md"

  cp "$REPO_ROOT/AGENTS.md" "$REPO_ROOT/CLAUDE.md"
  ok "Generated CLAUDE.md"

  # Shims
  mkdir -p "$REPO_ROOT/.cursor/rules" "$REPO_ROOT/.agent/rules" "$REPO_ROOT/.github"
  local shim_content="If you have NOT read \`AGENTS.md\` this session, read it NOW before proceeding.
Scan \`docs/kb/README.md\` for relevant topics.
On EVERY user message, check triggers: commit? correction? session end? -> run matching skill."
  echo "$shim_content" > "$REPO_ROOT/GEMINI.md"
  cat > "$REPO_ROOT/.cursor/rules/agents.mdc" << EOF
---
description: Project conventions — delegates to AGENTS.md
globs: **/*
alwaysApply: true
---

$shim_content
Skills in \`.agents/skills/\` — invoke by skill name or natural language.
EOF
  echo "$shim_content" > "$REPO_ROOT/.agent/rules/agent.md"
  echo "$shim_content" > "$REPO_ROOT/.github/copilot-instructions.md"
  ok "Generated tool shims"

  # .aiignore
  generate_aiignore > "$REPO_ROOT/.aiignore"
  ok "Generated .aiignore"

  # Base directories
  mkdir -p "$REPO_ROOT/.agents" "$REPO_ROOT/.claude/skills" "$REPO_ROOT/.claude/agents" "$REPO_ROOT/.claude/rules"

  # Claude Code project settings (starter — never overwrite user customizations)
  if [ ! -f "$REPO_ROOT/.claude/settings.json" ]; then
    local src="$SCRIPT_DIR/../.claude/settings.json"
    [ -f "$src" ] && cp "$src" "$REPO_ROOT/.claude/settings.json" && ok "Installed .claude/settings.json"
  fi

  # Claude Code scoped rules
  if [ ! -f "$REPO_ROOT/.claude/rules/agents.md" ]; then
    local src="$SCRIPT_DIR/../.claude/rules/agents.md"
    [ -f "$src" ] && cp "$src" "$REPO_ROOT/.claude/rules/agents.md" && ok "Installed .claude/rules/agents.md"
  fi

  # .gitignore
  local gi="$REPO_ROOT/.gitignore"
  for entry in "docs/kb/sessions/*.md" "!docs/kb/sessions/.gitkeep" ".claude/settings.local.json"; do
    if [ -f "$gi" ]; then
      grep -qF "$entry" "$gi" 2>/dev/null || echo "$entry" >> "$gi"
    else
      echo "$entry" >> "$gi"
    fi
  done

  # GUIDE.md
  if [ -f "$SCRIPT_DIR/../GUIDE.md" ] && [ ! -f "$REPO_ROOT/GUIDE.md" ]; then
    cp "$SCRIPT_DIR/../GUIDE.md" "$REPO_ROOT/GUIDE.md"
    ok "Copied GUIDE.md"
  fi

  # Trigger checklist
  if [ -f "$SCRIPT_DIR/../.agents/skills/TRIGGER-CHECKLIST.md" ]; then
    mkdir -p "$REPO_ROOT/.agents/skills"
    cp "$SCRIPT_DIR/../.agents/skills/TRIGGER-CHECKLIST.md" "$REPO_ROOT/.agents/skills/"
  fi
}

install_skill() {
  local skill_name="$1"
  local src="$SCRIPT_DIR/../.agents/skills/$skill_name"
  local dest="$REPO_ROOT/.agents/skills/$skill_name"
  local link="$REPO_ROOT/.claude/skills/$skill_name"

  if [ -d "$src" ] && [ ! -d "$dest" ]; then
    mkdir -p "$REPO_ROOT/.agents/skills"
    cp -r "$src" "$dest"
    ok "Installed skill: $skill_name"
  fi
  if [ ! -e "$link" ]; then
    mkdir -p "$REPO_ROOT/.claude/skills"
    ln -s "../../.agents/skills/$skill_name" "$link" 2>/dev/null
  fi
}

install_skills_quality()   { for s in pre-commit-check code-review dependency-audit; do install_skill "$s"; done; }
install_skills_knowledge() { for s in document-solution log-mistake check-kb-index; do install_skill "$s"; done; }
install_skills_session()   { for s in save-session session-end-checklist cleanup-sessions check-agent-drift; do install_skill "$s"; done; }
install_skills_planning()  { for s in create-plan execute-task execute-plan add-defect; do install_skill "$s"; done; }
install_skills_dev() {
  for s in scaffold-feature investigate-bug changelog-update dev-environment promptcraft; do install_skill "$s"; done
}
install_skills_meta()      { for s in list-skills evolve-framework; do install_skill "$s"; done; }

install_kb() {
  mkdir -p "$REPO_ROOT/docs/kb"/{architecture,features,integrations,api,bugfixes,ai-patterns,sessions}
  touch "$REPO_ROOT/docs/kb/sessions/.gitkeep"

  # Mistake log, trigger log, hooks reference
  for f in mistake-log trigger-log hooks-reference; do
    local target="$REPO_ROOT/docs/kb/ai-patterns/${f}.md"
    if [ ! -f "$target" ]; then
      local src="$SCRIPT_DIR/../docs/kb/ai-patterns/${f}.md"
      [ -f "$src" ] && cp "$src" "$target"
    fi
  done

  # KB README
  if [ ! -f "$REPO_ROOT/docs/kb/README.md" ]; then
    local src="$SCRIPT_DIR/../docs/kb/README.md"
    [ -f "$src" ] && cp "$src" "$REPO_ROOT/docs/kb/README.md"
  fi

  # Knowledge packs
  if [ -d "$KNOWLEDGE_PACKS_DIR" ]; then
    install_knowledge_packs
  fi

  # Project overview doc (auto-generated from detection)
  generate_project_kb_doc

  ok "Installed KB structure"
}

install_knowledge_packs() {
  local kb_dir="$REPO_ROOT/docs/kb/architecture"
  mkdir -p "$kb_dir"

  local pack_map=(
    "Ruby:ruby" "TypeScript:typescript" "JavaScript:typescript"
    "Python:python" "Go:go" "Rust:rust" "PHP:php" "Elixir:elixir"
  )
  for entry in "${pack_map[@]}"; do
    local lang="${entry%%:*}" pack="${entry##*:}"
    if [[ " ${LANGUAGES[*]} " =~ " $lang " ]]; then
      local src="$KNOWLEDGE_PACKS_DIR/${pack}.md" dest="$kb_dir/${pack}-conventions.md"
      [ -f "$src" ] && [ ! -f "$dest" ] && cp "$src" "$dest" && ok "KB pack: ${pack}-conventions.md"
    fi
  done

  local fw_map=(
    "Rails:rails" "React:react" "Next.js:nextjs" "Django:django"
    "FastAPI:fastapi" "Express:express" "Vue:vue" "Laravel:laravel" "Phoenix:phoenix"
  )
  for entry in "${fw_map[@]}"; do
    local fw="${entry%%:*}" pack="${entry##*:}"
    if [[ " ${FRAMEWORKS[*]} " =~ " $fw " ]]; then
      local src="$KNOWLEDGE_PACKS_DIR/${pack}.md" dest="$kb_dir/${pack}-conventions.md"
      [ -f "$src" ] && [ ! -f "$dest" ] && cp "$src" "$dest" && ok "KB pack: ${pack}-conventions.md"
    fi
  done

  # Cross-language pattern packs for opinionated MVC web frameworks
  local pattern_fws=("Rails" "Django" "Laravel" "Phoenix")
  local install_patterns=false
  for trigger_fw in "${pattern_fws[@]}"; do
    [[ " ${FRAMEWORKS[*]} " =~ " $trigger_fw " ]] && install_patterns=true && break
  done
  if [[ "$install_patterns" == true ]]; then
    for pack in patterns-security patterns-testing patterns-architecture; do
      local src="$KNOWLEDGE_PACKS_DIR/${pack}.md" dest="$kb_dir/${pack}.md"
      [ -f "$src" ] && [ ! -f "$dest" ] && cp "$src" "$dest" && ok "KB pack: ${pack}.md"
    done
  fi
}

install_plans() {
  mkdir -p "$REPO_ROOT/.plans"
  local src="$SCRIPT_DIR/../.plans/README.md"
  [ -f "$src" ] && [ ! -f "$REPO_ROOT/.plans/README.md" ] && cp "$src" "$REPO_ROOT/.plans/README.md"
  ok "Installed .plans/"
}

install_agents() {
  local src_dir="$SCRIPT_DIR/../.agents/agents"
  local codex_src_dir="$SCRIPT_DIR/../.codex/agents"
  local opencode_agents_src="$SCRIPT_DIR/../.opencode/agents"
  local opencode_commands_src="$SCRIPT_DIR/../.opencode/commands"
  mkdir -p "$REPO_ROOT/.agents/agents" "$REPO_ROOT/.claude/agents" "$REPO_ROOT/.codex/agents" \
           "$REPO_ROOT/.opencode/agents" "$REPO_ROOT/.opencode/commands"
  if [ -d "$src_dir" ]; then
    for f in "$src_dir"/*.md; do
      [ -f "$f" ] || continue
      local name=$(basename "$f")
      [ ! -f "$REPO_ROOT/.agents/agents/$name" ] && cp "$f" "$REPO_ROOT/.agents/agents/$name"
      [ ! -e "$REPO_ROOT/.claude/agents/$name" ] && ln -s "../../.agents/agents/$name" "$REPO_ROOT/.claude/agents/$name" 2>/dev/null
    done
  fi
  if [ -d "$codex_src_dir" ]; then
    for f in "$codex_src_dir"/*.toml; do
      [ -f "$f" ] || continue
      local name=$(basename "$f")
      [ ! -f "$REPO_ROOT/.codex/agents/$name" ] && cp "$f" "$REPO_ROOT/.codex/agents/$name"
    done
  fi
  if [ -d "$opencode_agents_src" ]; then
    for f in "$opencode_agents_src"/*.md; do
      [ -f "$f" ] || continue
      local name=$(basename "$f")
      [ ! -f "$REPO_ROOT/.opencode/agents/$name" ] && cp "$f" "$REPO_ROOT/.opencode/agents/$name"
    done
  fi
  if [ -d "$opencode_commands_src" ]; then
    for f in "$opencode_commands_src"/*.md; do
      [ -f "$f" ] || continue
      local name=$(basename "$f")
      [ ! -f "$REPO_ROOT/.opencode/commands/$name" ] && cp "$f" "$REPO_ROOT/.opencode/commands/$name"
    done
  fi
  if [ -d "$src_dir" ] || [ -d "$codex_src_dir" ]; then
    ok "Installed agent definitions for Claude, Codex, and opencode"
  fi
}

install_memory() {
  mkdir -p "$REPO_ROOT/.agents/memory"

  # Project profile (auto-generated)
  generate_project_profile > "$REPO_ROOT/.agents/memory/project-profile.md"
  ok "Generated project profile"

  for f in decisions preferences context-map; do
    local src="$SCRIPT_DIR/../.agents/memory/${f}.md"
    local dest="$REPO_ROOT/.agents/memory/${f}.md"
    [ -f "$src" ] && [ ! -f "$dest" ] && cp "$src" "$dest"
  done
  ok "Installed memory system"
}

install_ci() {
  mkdir -p "$REPO_ROOT/.github/workflows"
  for wf in ai-kb-check.yml pr-check.yml; do
    local src="$SCRIPT_DIR/../.github/workflows/$wf"
    local dest="$REPO_ROOT/.github/workflows/$wf"
    [ -f "$src" ] && [ ! -f "$dest" ] && cp "$src" "$dest" && ok "Installed workflow: $wf"
  done
}

migrate_existing_context() {
  local dest_dir="$REPO_ROOT/docs/kb/architecture"
  local dest="$dest_dir/project-context-pre-setup.md"

  # Only migrate once
  [ -f "$dest" ] && return

  local found_file=""
  [ -f "$REPO_ROOT/AGENTS.md" ] && found_file="$REPO_ROOT/AGENTS.md"
  [ -z "$found_file" ] && [ -f "$REPO_ROOT/CLAUDE.md" ] && found_file="$REPO_ROOT/CLAUDE.md"
  [ -z "$found_file" ] && return

  # Skip if file is already framework-generated (our output)
  if grep -q "Auto-generated by setup.sh\|AI Dev Framework — Modular Setup" "$found_file" 2>/dev/null; then
    return
  fi

  mkdir -p "$dest_dir"
  {
    echo "# Project Context (Pre-Setup)"
    echo ""
    echo "> Migrated from \`$(basename "$found_file")\` before framework setup on $(date +%Y-%m-%d)."
    echo "> Review this file and move relevant sections into appropriate KB docs."
    echo ""
    echo "---"
    echo ""
    cat "$found_file"
  } > "$dest"
  ok "Migrated existing $(basename "$found_file") → docs/kb/architecture/project-context-pre-setup.md"
}

# =============================================================================
# DYNAMIC AGENTS.MD GENERATOR
# =============================================================================

generate_agents_md() {
  local deployment fw_str pkg_str db_str test_cmd lint_cmd dev_cmd
  deployment=$(detect_deployment)
  fw_str=$(join_array ", " "${FRAMEWORKS[@]}")
  [ -z "$fw_str" ] && fw_str=$(join_array ", " "${LANGUAGES[@]}")
  pkg_str=$(join_array ", " "${PACKAGE_MANAGERS[@]}")
  db_str=$(join_array ", " "${DATABASES[@]}")
  [ -z "$db_str" ] && db_str="—"
  test_cmd=$(build_test_cmd); lint_cmd=$(build_lint_cmd); dev_cmd=$(build_dev_cmd)

  cat << HEADER
<!-- ai-dev-framework v${FRAMEWORK_VERSION} — update skills via /upgrade-framework -->
# AGENTS.md

---

HEADER

  # Quick Triggers — only if we have skills
  if has_component "skills-quality" || has_component "skills-knowledge" || has_component "skills-session"; then
    cat << 'TRIGGERS'
## Quick Triggers

**Session Start**: Check `docs/kb/ai-patterns/mistake-log.md` for patterns to avoid.

**During Session**:
TRIGGERS
    has_component "skills-quality" && echo '- User says "commit/stage" -> run `pre-commit-check`'
    has_component "skills-knowledge" && echo '- You get corrected -> run `log-mistake`'
    has_component "skills-knowledge" && echo '- KB lookup fails -> after solving, run `document-solution`'
    has_component "skills-knowledge" && echo '- You modify KB files -> run `check-kb-index`'
    echo ""
    has_component "skills-session" && echo '**Session End** (user says "done/thanks/bye"): Run `session-end-checklist`'
    echo -e "\n---\n"
  fi

  # Project Context — always
  cat << CONTEXT
## Project Context

**Project**: $PROJECT_NAME

| Aspect | Value |
|--------|-------|
| Language/Framework | $fw_str |
| Architecture | $ARCHITECTURE |
| Main branch | \`$MAIN_BRANCH\` |
| Deployment | $deployment |
| Database | $db_str |
| Package manager | $pkg_str |

**Key commands**:
\`\`\`bash
$test_cmd       # Run tests
$lint_cmd       # Lint
$dev_cmd        # Dev server
\`\`\`

---

CONTEXT

  # KB section — only if kb component
  if has_component "kb"; then
    cat << 'KB'
## Knowledge Base

Index: `docs/kb/README.md`

Load ONLY relevant docs. Do not load entire KB.

### KB-First Rule

Before exploring code: check `docs/kb/README.md` for a matching doc. If found,
read it before any grep/read. If not found, explore code, then run
`document-solution` if non-trivial.

---

KB
  fi

  # Memory section — only if memory component
  if has_component "memory"; then
    cat << 'MEMORY'
## Memory

At session start, read `.agents/memory/project-profile.md` for cached context.
Check `.agents/memory/decisions.md` when making architectural choices.
Update `.agents/memory/preferences.md` when you learn how the user works.

---

MEMORY
  fi

  # Constraints — always
  cat << 'CONSTRAINTS'
## Critical Constraints

1. **No magic strings** - Use constants, enums, or config values
2. **No N+1 queries** - Use eager loading where applicable
3. **Sanitize inputs** - Validate at system boundaries
4. **Parameterized queries** - Never interpolate user input into queries

---

## Things to Avoid

1. Over-engineering - only make directly requested changes
2. Breaking existing tests - run tests before committing
3. Adding dependencies without evaluating alternatives
4. Large PRs - prefer small, focused changesets

---

CONSTRAINTS

  # Auto-Triggers — only if relevant skills installed
  if has_component "skills-quality" || has_component "skills-knowledge" || has_component "skills-session"; then
    echo "## Auto-Triggers"
    echo ""
    echo "| Trigger | Action |"
    echo "|---------|--------|"
    has_component "skills-quality" && echo '| User says "commit", "stage", "push" | `pre-commit-check` |'
    has_component "skills-knowledge" && echo '| KB lookup fails -> solved via code | `document-solution` |'
    has_component "skills-knowledge" && echo '| User corrects you | `log-mistake` |'
    has_component "skills-knowledge" && echo '| Modified KB files | `check-kb-index` |'
    has_component "skills-session" && echo '| User ending session | `session-end-checklist` |'
    echo -e "\n---\n"
  fi

  # Skills table — only installed skills
  local has_any_skill=false
  for c in skills-quality skills-knowledge skills-session skills-planning skills-dev skills-meta; do
    has_component "$c" && has_any_skill=true && break
  done

  if $has_any_skill; then
    echo "## Skills"
    echo ""
    echo "| Skill | When |"
    echo "|-------|------|"
    has_component "skills-quality" && echo '| `pre-commit-check` | Before commit/staging |
| `code-review` | Self-review before PR |
| `dependency-audit` | Check for vulnerable/outdated deps |'
    has_component "skills-knowledge" && echo '| `document-solution` | Complex problem solved or KB miss |
| `log-mistake` | User corrects you |
| `check-kb-index` | After KB file changes |'
    has_component "skills-session" && echo '| `save-session` | Long session or pausing work |
| `session-end-checklist` | Session ending |'
    has_component "skills-planning" && echo '| `create-plan` | Starting a multi-step feature |
| `execute-task` | Working on a plan task |
| `execute-plan` | Running remaining plan tasks |'
    has_component "skills-dev" && echo '| `scaffold-feature` | Bootstrapping a new feature |
| `investigate-bug` | Bug — investigate, root cause, fix, document |
| `dev-environment` | Start/stop/reset/doctor local dev (AI-configured during init) |
| `changelog-update` | Updating CHANGELOG.md from commits |'
    has_component "skills-meta" && echo '| `evolve-framework` | Self-improve: audit, research, suggest |
| `list-skills` | Show all available skills |'
    echo -e "\n---\n"
  fi

  # Agents — only if installed
  if has_component "agents"; then
    cat << 'AGENTS'
## Agents

`.agents/agents/`: Claude/tool-agnostic role specs.
`.codex/agents/`: Codex-native custom agents with the same roles.

---

AGENTS
  fi

  # REMEMBER footer — always
  echo "## REMEMBER"
  echo ""
  echo "Before responding, check:"
  has_component "skills-knowledge" && echo '1. **Am I being corrected?** -> `log-mistake`'
  has_component "skills-quality" && echo '2. **Is user committing?** -> `pre-commit-check`'
  has_component "skills-session" && echo '3. **Is user ending session?** -> `session-end-checklist`'
  has_component "skills-knowledge" && echo '4. **Did I solve something complex without KB?** -> `document-solution`'
}

generate_project_profile() {
  cat << PROFILE
# Project Profile

**Auto-generated by setup.sh** — update manually if detection was wrong.
**Last Updated**: $(date +%Y-%m-%d)

| Aspect | Value |
|--------|-------|
| Project | $PROJECT_NAME |
| Languages | $(join_array ", " "${LANGUAGES[@]}") |
| Frameworks | $(join_array ", " "${FRAMEWORKS[@]}") |
| Package managers | $(join_array ", " "${PACKAGE_MANAGERS[@]}") |
| Test runners | $(join_array ", " "${TEST_RUNNERS[@]}") |
| Linters | $(join_array ", " "${LINTERS[@]}") |
| Database | $(join_array ", " "${DATABASES[@]}") |
| CI/CD | $(join_array ", " "${CI_SYSTEMS[@]}") |
| Architecture | $ARCHITECTURE |
| Main branch | \`$MAIN_BRANCH\` |
PROFILE
}

generate_project_kb_doc() {
  local dest="$REPO_ROOT/docs/kb/architecture/project-overview.md"
  # Don't overwrite if it already exists (respect manual edits)
  [ -f "$dest" ] && return

  local deployment fw_str lang_str test_str lint_str db_str ci_str pkg_str
  deployment=$(detect_deployment)
  fw_str=$(join_array ", " "${FRAMEWORKS[@]}");       [ -z "$fw_str" ]   && fw_str="—"
  lang_str=$(join_array ", " "${LANGUAGES[@]}");      [ -z "$lang_str" ] && lang_str="—"
  test_str=$(join_array ", " "${TEST_RUNNERS[@]}");   [ -z "$test_str" ] && test_str="—"
  lint_str=$(join_array ", " "${LINTERS[@]}");        [ -z "$lint_str" ] && lint_str="—"
  db_str=$(join_array ", " "${DATABASES[@]}");        [ -z "$db_str" ]   && db_str="—"
  ci_str=$(join_array ", " "${CI_SYSTEMS[@]}");       [ -z "$ci_str" ]   && ci_str="—"
  pkg_str=$(join_array ", " "${PACKAGE_MANAGERS[@]}"); [ -z "$pkg_str" ] && pkg_str="—"

  cat > "$dest" << DOC
# Project Overview

**Auto-generated by setup.sh on $(date +%Y-%m-%d)** — update manually as the project evolves.

## Stack

| Aspect | Detected |
|--------|----------|
| Project | $PROJECT_NAME |
| Languages | $lang_str |
| Frameworks | $fw_str |
| Architecture | $ARCHITECTURE |
| Package managers | $pkg_str |
| Databases | $db_str |
| Test runners | $test_str |
| Linters | $lint_str |
| CI/CD | $ci_str |
| Deployment | $deployment |
| Main branch | \`$MAIN_BRANCH\` |

## Key Commands

\`\`\`bash
$(build_test_cmd)   # Run tests
$(build_lint_cmd)   # Lint
$(build_dev_cmd)    # Dev server
\`\`\`

## Architecture Notes

<!-- Add notes about the project's architecture, patterns, and conventions here. -->
<!-- See project-context-pre-setup.md if the project had an existing AGENTS.md/CLAUDE.md. -->
DOC
  ok "Generated docs/kb/architecture/project-overview.md"
}

generate_aiignore() {
  cat << 'BASE'
# .aiignore
.env
.env.*
!.env.example
**/credentials*
**/*.pem
**/*.key
node_modules/
vendor/bundle/
__pycache__/
.venv/
target/
dist/
build/
out/
coverage/
tmp/
log/
*.lock
yarn.lock
package-lock.json
Gemfile.lock
Cargo.lock
poetry.lock
*.png
*.jpg
*.gif
*.ico
*.woff*
*.ttf
*.eot
*.mp4
*.zip
*.tar.gz
*.pdf
.idea/
.vscode/settings.json
*.swp
.DS_Store
BASE
}

# =============================================================================
# COMPONENT STATE
# =============================================================================

INSTALL_LIST=()

has_component() {
  [[ " ${INSTALL_LIST[*]} " =~ " $1 " ]]
}

get_installed() {
  if [ -f "$INSTALLED_FILE" ]; then
    cat "$INSTALLED_FILE"
  fi
}

save_installed() {
  mkdir -p "$(dirname "$INSTALLED_FILE")"
  echo "${INSTALL_LIST[*]}" > "$INSTALLED_FILE"
}

# =============================================================================
# MAIN MODES
# =============================================================================

show_help() {
  cat << 'HELP'
AI Dev Framework — Modular Setup

Usage:
  scripts/setup.sh                                Interactive profile picker
  scripts/setup.sh --profile <name>               Install a preset profile
  scripts/setup.sh --components <list>             Install specific components
  scripts/setup.sh --add <component>               Add component to existing install
  scripts/setup.sh --remove <component>            Remove a component
  scripts/setup.sh --list                          Show all components & profiles
  scripts/setup.sh --target <dir>                  Install into a specific directory
  scripts/setup.sh --dry-run [options]             Preview without writing

Profiles: minimal, lite, standard, full

Components: core, skills-quality, skills-knowledge, skills-session,
  skills-planning, skills-dev, skills-meta, kb, plans, agents, memory, ci
HELP
}

show_list() {
  echo ""
  echo -e "${BOLD}Profiles:${NC}"
  echo "  minimal   — $PROFILE_minimal"
  echo "  lite      — $PROFILE_lite"
  echo "  standard  — $PROFILE_standard"
  echo "  full      — $PROFILE_full"
  echo ""
  echo -e "${BOLD}Components:${NC}"
  for comp in $ALL_COMPONENTS; do
    source "$COMPONENTS_DIR/$comp/manifest.sh"
    local deps_str=""
    [ -n "$COMPONENT_DEPS" ] && deps_str=" (requires: $COMPONENT_DEPS)"
    local installed=""
    if [ -f "$INSTALLED_FILE" ] && grep -q "$comp" "$INSTALLED_FILE" 2>/dev/null; then
      installed=" ${GREEN}[installed]${NC}"
    fi
    echo -e "  $comp — $COMPONENT_DESC$deps_str$installed"
  done
  echo ""
}

interactive_picker() {
  echo ""
  echo -e "${BOLD}Choose a profile:${NC}"
  echo ""
  echo "  1) minimal   — Just AGENTS.md + auto-detection. For simple scripts."
  echo "  2) lite      — Add quality skills (pre-commit, code-review, dep-audit)."
  echo "  3) standard  — Quality + KB + knowledge skills + sessions + dev skills. [recommended]"
  echo "  4) full      — Everything: planning, agents, memory, CI, evolution."
  echo "  5) custom    — Pick components individually."
  echo ""
  read -r -p "Select [1-5, default=3]: " choice

  case "${choice:-3}" in
    1) PROFILE="minimal" ;;
    2) PROFILE="lite" ;;
    3) PROFILE="standard" ;;
    4) PROFILE="full" ;;
    5)
      echo ""
      echo "Available components: $ALL_COMPONENTS"
      echo ""
      read -r -p "Enter components (comma-separated): " COMPONENTS_ARG
      MODE="custom"
      return
      ;;
    *) PROFILE="standard" ;;
  esac
  MODE="profile"
}

install_component() {
  local comp="$1"
  case "$comp" in
    core)              install_core ;;
    skills-quality)    install_skills_quality ;;
    skills-knowledge)  install_skills_knowledge ;;
    skills-session)    install_skills_session ;;
    skills-planning)   install_skills_planning ;;
    skills-dev)        install_skills_dev ;;
    skills-meta)       install_skills_meta ;;
    kb)                install_kb ;;
    plans)             install_plans ;;
    agents)            install_agents ;;
    memory)            install_memory ;;
    ci)                install_ci ;;
    *) warn "Unknown component: $comp" ;;
  esac
}

# =============================================================================
# ENTRY POINT
# =============================================================================

echo ""
echo "=== AI Dev Framework — Setup ==="
echo "Project: $REPO_ROOT"
echo ""

# Handle simple modes
case "$MODE" in
  help) show_help; exit 0 ;;
  list) detect_all; show_list; exit 0 ;;
esac

# Detect stack
detect_all

echo "--- Detection ---"
info "Project:    $PROJECT_NAME"
info "Stack:      $(join_array ', ' "${FRAMEWORKS[@]}") ($(join_array ', ' "${LANGUAGES[@]}"))"
info "Tests:      $(join_array ', ' "${TEST_RUNNERS[@]}")"
[ ${#TEST_RUNNERS[@]} -eq 0 ] && warn "No test runner detected. To set one up, run: /setup-tests"
info "Linter:     $(join_array ', ' "${LINTERS[@]}")"
info "DB:         $(join_array ', ' "${DATABASES[@]}")"
info "Arch:       $ARCHITECTURE"
echo ""

# Determine what to install
case "$MODE" in
  profile)
    local_var="PROFILE_${PROFILE}"
    components="${!local_var}"
    if [ -z "$components" ]; then
      err "Unknown profile: $PROFILE"
      echo "Available: $ALL_PROFILES"
      exit 1
    fi
    IFS=' ' read -ra INSTALL_LIST <<< "$components"
    info "Profile: $PROFILE → $components"
    ;;

  custom)
    IFS=',' read -ra requested <<< "$COMPONENTS_ARG"
    resolved=$(resolve_deps "${requested[@]}")
    IFS=' ' read -ra INSTALL_LIST <<< "$resolved"
    info "Components: ${INSTALL_LIST[*]}"
    if [ "${#INSTALL_LIST[@]}" -gt "${#requested[@]}" ]; then
      info "Auto-added dependencies: $(comm -23 <(echo "${INSTALL_LIST[*]}" | tr ' ' '\n' | sort) <(echo "${requested[*]}" | tr ' ' '\n' | sort) | tr '\n' ' ')"
    fi
    ;;

  add)
    existing=$(get_installed)
    IFS=' ' read -ra INSTALL_LIST <<< "$existing"
    resolved=$(resolve_deps "$ADD_COMPONENT")
    IFS=' ' read -ra new_comps <<< "$resolved"
    for c in "${new_comps[@]}"; do
      has_component "$c" || INSTALL_LIST+=("$c")
    done
    info "Adding: $ADD_COMPONENT (total: ${INSTALL_LIST[*]})"
    ;;

  remove)
    existing=$(get_installed)
    IFS=' ' read -ra INSTALL_LIST <<< "$existing"
    local new_list=()
    for c in "${INSTALL_LIST[@]}"; do
      [ "$c" != "$REMOVE_COMPONENT" ] && new_list+=("$c")
    done
    INSTALL_LIST=("${new_list[@]}")
    info "Removed: $REMOVE_COMPONENT (remaining: ${INSTALL_LIST[*]})"
    ;;

  "")
    interactive_picker
    if [ "$MODE" = "profile" ]; then
      local_var="PROFILE_${PROFILE}"
      components="${!local_var}"
      IFS=' ' read -ra INSTALL_LIST <<< "$components"
      info "Profile: $PROFILE → $components"
    elif [ "$MODE" = "custom" ]; then
      IFS=',' read -ra requested <<< "$COMPONENTS_ARG"
      resolved=$(resolve_deps "${requested[@]}")
      IFS=' ' read -ra INSTALL_LIST <<< "$resolved"
      info "Components: ${INSTALL_LIST[*]}"
    fi
    ;;
esac

if [ ${#INSTALL_LIST[@]} -eq 0 ]; then
  err "No components selected"
  exit 1
fi

# Dry run check
if $DRY_RUN; then
  echo ""
  echo "=== Dry run — would install: ${INSTALL_LIST[*]} ==="
  exit 0
fi

# Install
echo ""
echo "--- Installing ---"
echo ""

# Migrate any existing AGENTS.md/CLAUDE.md into KB before we overwrite them
if has_component "kb"; then
  migrate_existing_context
fi

for comp in "${INSTALL_LIST[@]}"; do
  install_component "$comp"
done

# Regenerate AGENTS.md after all components installed (it needs to know what's installed)
generate_agents_md > "$REPO_ROOT/AGENTS.md"
cp "$REPO_ROOT/AGENTS.md" "$REPO_ROOT/CLAUDE.md"

# Save installed state
save_installed

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Installed: ${INSTALL_LIST[*]}"
echo ""
echo "Next:"
echo "  1. Review AGENTS.md — tweak constraints or commands"
echo "  2. Start coding with AI"
if ! has_component "kb"; then
  echo ""
  echo "  Add KB later:     scripts/setup.sh --add kb"
fi
if ! has_component "agents"; then
  echo "  Add agents later:  scripts/setup.sh --add agents"
fi
if ! has_component "plans"; then
  echo "  Add planning:      scripts/setup.sh --add skills-planning"
fi
echo ""
