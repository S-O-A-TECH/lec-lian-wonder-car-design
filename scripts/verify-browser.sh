#!/usr/bin/env bash
# Browser verification checklist — run after dev server is started
# This script checks if the dev server is responding on expected routes
# Usage: ./scripts/verify-browser.sh

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
ERRORS=0

echo "============================================"
echo "  Browser Route Verification"
echo "  Base URL: $BASE_URL"
echo "============================================"

check_route() {
  local path="$1"
  local name="$2"
  local url="${BASE_URL}${path}"

  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [ "$status" = "200" ]; then
    echo "  ✓ $name ($path) — HTTP $status"
  else
    echo "  ✗ $name ($path) — HTTP $status"
    ERRORS=$((ERRORS + 1))
  fi
}

check_api() {
  local path="$1"
  local name="$2"
  local url="http://localhost:4000${path}"

  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [ "$status" = "200" ]; then
    echo "  ✓ API: $name ($path) — HTTP $status"
  else
    echo "  ✗ API: $name ($path) — HTTP $status"
    ERRORS=$((ERRORS + 1))
  fi
}

echo ""
echo "[Pages]"
check_route "/" "Landing Page"
check_route "/studio" "Studio"
check_route "/gallery" "Gallery"

echo ""
echo "[API Endpoints]"
check_api "/api/models" "Models catalog"
check_api "/api/models/parts/wheels" "Wheels parts"
check_api "/api/models/parts/color" "Color parts"
check_api "/api/designs" "Designs list"

echo ""
echo "============================================"
if [ $ERRORS -gt 0 ]; then
  echo "  FAILED: $ERRORS routes not responding"
  exit 1
else
  echo "  PASSED: All routes responding"
fi
echo "============================================"
