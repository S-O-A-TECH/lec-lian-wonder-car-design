#!/usr/bin/env bash
# Master verification — runs ALL checks in sequence
# Usage: ./scripts/verify-all.sh
# Run this after completing each implementation task

set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     WONDER CAR — Master Verification         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0

run_check() {
  local name="$1"
  local script="$2"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Running: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if bash "$script" 2>&1; then
    TOTAL_PASS=$((TOTAL_PASS + 1))
    echo ""
  else
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
    echo ""
    echo "  ⚠ $name FAILED — fix before proceeding"
    echo ""
  fi
}

# 1. Syntax
run_check "Syntax Verification" "scripts/verify-syntax.sh"

# 2. Consistency
run_check "Consistency Verification" "scripts/verify-consistency.sh"

# 3. Build (includes syntax + vite build + server test)
run_check "Build Verification" "scripts/verify-build.sh"

# Final summary
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  FINAL RESULT: $TOTAL_PASS passed, $TOTAL_FAIL failed"
if [ $TOTAL_FAIL -eq 0 ]; then
  echo "║  STATUS: ALL CHECKS PASSED"
else
  echo "║  STATUS: VERIFICATION FAILED"
fi
echo "╚══════════════════════════════════════════════╝"
echo ""

if [ $TOTAL_FAIL -gt 0 ]; then
  exit 1
fi
