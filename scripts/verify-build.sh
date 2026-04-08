#!/usr/bin/env bash
# Full build verification: syntax + Vite build + server start test
# Usage: ./scripts/verify-build.sh

set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================"
echo "  WONDER CAR — Full Build Verification"
echo "============================================"

STEP=0
PASSED=0
FAILED=0

pass() { PASSED=$((PASSED + 1)); echo "  ✓ PASS: $1"; }
fail() { FAILED=$((FAILED + 1)); echo "  ✗ FAIL: $1"; }

# Step 1: Check dependencies installed
STEP=$((STEP + 1))
echo ""
echo "[$STEP] Checking dependencies..."
if [ -d "client/node_modules" ] && [ -d "server/node_modules" ]; then
  pass "Dependencies installed"
else
  fail "Dependencies missing — run npm install in client/ and server/"
fi

# Step 2: Syntax check
STEP=$((STEP + 1))
echo ""
echo "[$STEP] Running syntax checks..."
if bash scripts/verify-syntax.sh 2>&1; then
  pass "Syntax checks"
else
  fail "Syntax checks"
fi

# Step 3: Vite build (if client exists)
STEP=$((STEP + 1))
echo ""
echo "[$STEP] Testing Vite build..."
if [ -f "client/package.json" ] && [ -d "client/node_modules" ]; then
  cd client
  if npx vite build 2>&1 | tail -5; then
    pass "Vite build"
  else
    fail "Vite build"
  fi
  cd "$PROJECT_ROOT"
else
  echo "  - Skipped (client not yet set up)"
fi

# Step 4: Server start test
STEP=$((STEP + 1))
echo ""
echo "[$STEP] Testing server startup..."
if [ -f "server/index.js" ] && [ -d "server/node_modules" ]; then
  cd server
  # Start server in background, wait 3 seconds, test, then kill
  node index.js &
  SERVER_PID=$!
  sleep 3

  if curl -s http://localhost:4000/api/models > /dev/null 2>&1; then
    pass "Server starts and responds"
  else
    fail "Server not responding"
  fi

  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  cd "$PROJECT_ROOT"
else
  echo "  - Skipped (server not yet set up)"
fi

# Step 5: Import consistency check
STEP=$((STEP + 1))
echo ""
echo "[$STEP] Checking import consistency..."
if [ -d "client/src" ]; then
  IMPORT_ERRORS=0
  # Check that all imported local files exist
  grep -rn "from './" client/src/ 2>/dev/null | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    import_path=$(echo "$line" | sed "s/.*from '\(\.\/[^']*\)'.*/\1/")
    dir=$(dirname "$file")
    resolved="$dir/$import_path"

    found=false
    for ext in "" ".js" ".jsx" ".css"; do
      if [ -f "${resolved}${ext}" ]; then
        found=true
        break
      fi
    done

    if [ "$found" = "false" ]; then
      echo "  MISSING: $file → $import_path"
      IMPORT_ERRORS=$((IMPORT_ERRORS + 1))
    fi
  done

  if [ $IMPORT_ERRORS -eq 0 ]; then
    pass "Import consistency"
  else
    fail "Import consistency ($IMPORT_ERRORS missing imports)"
  fi
else
  echo "  - Skipped (client/src not yet created)"
fi

# Summary
echo ""
echo "============================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "============================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
