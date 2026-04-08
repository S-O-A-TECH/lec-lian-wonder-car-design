#!/usr/bin/env bash
# Verify JavaScript/JSX syntax by checking with Node.js
# Usage: ./scripts/verify-syntax.sh [file_path]
# If no file_path given, checks all .js/.jsx files in client/src and server/

set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

check_file() {
  local file="$1"
  # Skip non-existent files
  [ -f "$file" ] || return 0

  # For .jsx files, we can't use node --check directly
  # Instead verify the file is valid UTF-8 and has matching brackets
  local ext="${file##*.}"

  if [ "$ext" = "js" ] || [ "$ext" = "mjs" ]; then
    if ! node --check "$file" 2>/dev/null; then
      echo "SYNTAX ERROR: $file"
      ERRORS=$((ERRORS + 1))
    fi
  elif [ "$ext" = "jsx" ]; then
    # Check for common JSX issues: unmatched braces, missing imports
    # Count opening vs closing braces
    local open_braces=$(grep -o '{' "$file" 2>/dev/null | wc -l)
    local close_braces=$(grep -o '}' "$file" 2>/dev/null | wc -l)
    if [ "$open_braces" != "$close_braces" ]; then
      echo "BRACE MISMATCH: $file (open: $open_braces, close: $close_braces)"
      ERRORS=$((ERRORS + 1))
    fi

    # Check for common import issues
    if grep -q "from './" "$file" 2>/dev/null; then
      # Extract relative imports and check if files exist
      grep "from './" "$file" | while read -r line; do
        local import_path=$(echo "$line" | sed "s/.*from '\(\.\/[^']*\)'.*/\1/")
        local dir=$(dirname "$file")
        local resolved="$dir/$import_path"

        # Try with extensions
        local found=false
        for ext in "" ".js" ".jsx" ".css"; do
          if [ -f "${resolved}${ext}" ]; then
            found=true
            break
          fi
        done

        if [ "$found" = "false" ]; then
          echo "IMPORT WARNING: $file imports '$import_path' but file not found"
        fi
      done
    fi
  elif [ "$ext" = "css" ]; then
    # Check for unclosed braces in CSS
    local open_braces=$(grep -o '{' "$file" 2>/dev/null | wc -l)
    local close_braces=$(grep -o '}' "$file" 2>/dev/null | wc -l)
    if [ "$open_braces" != "$close_braces" ]; then
      echo "CSS BRACE MISMATCH: $file (open: $open_braces, close: $close_braces)"
      ERRORS=$((ERRORS + 1))
    fi
  fi
}

if [ $# -gt 0 ]; then
  check_file "$1"
else
  echo "=== Checking all source files ==="
  # Check server JS files
  if [ -d "$PROJECT_ROOT/server" ]; then
    find "$PROJECT_ROOT/server" -name "*.js" -not -path "*/node_modules/*" | while read -r f; do
      check_file "$f"
    done
  fi

  # Check client files
  if [ -d "$PROJECT_ROOT/client/src" ]; then
    find "$PROJECT_ROOT/client/src" -name "*.jsx" -o -name "*.js" -o -name "*.css" | while read -r f; do
      check_file "$f"
    done
  fi
fi

if [ $ERRORS -gt 0 ]; then
  echo "FAILED: $ERRORS errors found"
  exit 1
else
  echo "PASSED: All syntax checks passed"
  exit 0
fi
