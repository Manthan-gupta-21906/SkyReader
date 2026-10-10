#!/usr/bin/env bash
# Usage:
#   bash setup.sh [project_name] [docs_dir]
#
#   project_name  folder to create (default: skyreader)
#   docs_dir      folder that holds your downloaded documents (default: current folder)
#
# What it does:
#   1. creates <project_name>/requirement/ and copies every .md/.pdf/.docx there
#      (except this script's own files)
#   2. copies OPENCODE_PROMPT.md into the project root
#   3. initializes git on branch "main" and makes the first clean commit
set -euo pipefail

PROJECT="${1:-skyreader}"
DOCS_DIR="${2:-.}"

mkdir -p "$PROJECT/requirement"

copied=0
shopt -s nullglob
for f in "$DOCS_DIR"/*.md "$DOCS_DIR"/*.pdf "$DOCS_DIR"/*.docx; do
  base="$(basename "$f")"
  case "$base" in
    OPENCODE_PROMPT.md) continue ;;
  esac
  cp "$f" "$PROJECT/requirement/"
  echo "added to requirement/: $base"
  copied=$((copied + 1))
done

if [ "$copied" -eq 0 ]; then
  echo "WARNING: no documents found in '$DOCS_DIR'. Put your 6 files in $PROJECT/requirement/ before running OpenCode."
fi

if [ -f "$DOCS_DIR/OPENCODE_PROMPT.md" ]; then
  cp "$DOCS_DIR/OPENCODE_PROMPT.md" "$PROJECT/OPENCODE_PROMPT.md"
elif [ -f "./OPENCODE_PROMPT.md" ]; then
  cp "./OPENCODE_PROMPT.md" "$PROJECT/OPENCODE_PROMPT.md"
else
  echo "WARNING: OPENCODE_PROMPT.md not found; copy it into $PROJECT/ yourself."
fi

cd "$PROJECT"

if [ ! -d .git ]; then
  git init -b main
fi

cat > .gitignore <<'EOF'
node_modules/
dist/
.env
.env.*
*.log
.DS_Store
.vscode/
.idea/
__pycache__/
*.pyc
.venv/
ml/data/
ml/packs/*.zip
*.onnx.tmp
EOF

git add .
if ! git diff --cached --quiet; then
  git commit -m "docs: add project requirements and build prompt"
fi

echo
echo "Done. Next steps:"
echo "  cd $PROJECT"
echo "  opencode            # then paste the contents of OPENCODE_PROMPT.md"
echo
echo "To publish on GitHub (optional, needs the GitHub CLI):"
echo "  gh repo create $PROJECT --private --source=. --remote=origin --push"
