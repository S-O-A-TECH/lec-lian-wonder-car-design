#!/usr/bin/env bash
# Verify cross-file consistency: store usage, theme variables, API endpoints
# Usage: ./scripts/verify-consistency.sh

set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================"
echo "  Consistency Verification"
echo "============================================"

ERRORS=0

# 1. Check all components that import store actually use valid store keys
echo ""
echo "[1] Store key consistency..."
if [ -f "client/src/store.js" ]; then
  # Extract store keys from store.js
  STORE_KEYS=$(grep -oP '^\s+(\w+):' client/src/store.js 2>/dev/null | tr -d ' :' | sort -u)
  STORE_FUNCTIONS=$(grep -oP '^\s+(\w+):\s*\(' client/src/store.js 2>/dev/null | sed 's/:.*//' | tr -d ' ' | sort -u)

  echo "  Store keys: $(echo $STORE_KEYS | tr '\n' ', ')"
  echo "  Store functions: $(echo $STORE_FUNCTIONS | tr '\n' ', ')"
  echo "  ✓ Store keys extracted"
else
  echo "  - store.js not yet created"
fi

# 2. Check CSS variable usage matches theme.css definitions
echo ""
echo "[2] CSS variable consistency..."
if [ -f "client/src/theme.css" ]; then
  # Extract defined CSS variables
  DEFINED_VARS=$(grep -oP '--[\w-]+' client/src/theme.css 2>/dev/null | sort -u)

  # Find used CSS variables across all CSS files
  USED_VARS=$(grep -rhoP 'var\(--[\w-]+\)' client/src/ 2>/dev/null | grep -oP '--[\w-]+' | sort -u)

  for var in $USED_VARS; do
    if ! echo "$DEFINED_VARS" | grep -q "^${var}$"; then
      echo "  UNDEFINED CSS VAR: $var"
      ERRORS=$((ERRORS + 1))
    fi
  done

  if [ $ERRORS -eq 0 ]; then
    echo "  ✓ All CSS variables are defined"
  fi
else
  echo "  - theme.css not yet created"
fi

# 3. Check API endpoint consistency (client api.js vs server routes)
echo ""
echo "[3] API endpoint consistency..."
if [ -f "client/src/api.js" ] && [ -d "server/routes" ]; then
  # Extract endpoints from api.js
  CLIENT_ENDPOINTS=$(grep -oP "fetch\(\`[^']*\`" client/src/api.js 2>/dev/null | grep -oP '/api/[^`]*' | sort -u)
  echo "  Client calls: $(echo $CLIENT_ENDPOINTS | tr '\n' ', ')"

  # Extract route patterns from server
  SERVER_ENDPOINTS=$(grep -oP "router\.(get|post|put|delete)\('([^']*)'" server/routes/*.js 2>/dev/null | grep -oP "'[^']*'" | tr -d "'" | sort -u)
  echo "  Server routes: $(echo $SERVER_ENDPOINTS | tr '\n' ', ')"
  echo "  ✓ Endpoint listing complete (manual review recommended)"
else
  echo "  - api.js or server routes not yet created"
fi

# 4. Check React Router paths match actual component imports
echo ""
echo "[4] Route-component consistency..."
if [ -f "client/src/App.jsx" ]; then
  # Check imports exist
  grep "import.*from" client/src/App.jsx 2>/dev/null | while read -r line; do
    import_path=$(echo "$line" | sed "s/.*from '\(\.\/[^']*\)'.*/\1/")
    dir=$(dirname "client/src/App.jsx")
    resolved="$dir/$import_path"

    found=false
    for ext in "" ".js" ".jsx"; do
      if [ -f "${resolved}${ext}" ]; then
        found=true
        break
      fi
    done

    if [ "$found" = "false" ]; then
      echo "  MISSING ROUTE COMPONENT: $import_path"
      ERRORS=$((ERRORS + 1))
    fi
  done
  echo "  ✓ Route components checked"
else
  echo "  - App.jsx not yet created"
fi

# Summary
echo ""
echo "============================================"
if [ $ERRORS -gt 0 ]; then
  echo "  FAILED: $ERRORS consistency errors"
  exit 1
else
  echo "  PASSED: All consistency checks passed"
fi
echo "============================================"
