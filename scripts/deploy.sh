#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: npm run deploy -- \"Commit message\""
  echo ""
  echo "Default behavior:"
  echo "  - Runs npm run build:prod"
  echo "  - Publishes dist/ directly to the linked Netlify site"
  echo "  - Includes local Netlify functions from netlify/functions"
  echo ""
  exit 0
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "Error: Netlify CLI is required. Install with: npm i -g netlify-cli"
  exit 1
fi

MESSAGE="${1:-Deploy: $(date '+%Y-%m-%d %H:%M')}"

echo "Building site..."
npm run build:prod

SITE_ID="$(node -e 'const fs=require("fs");const s=JSON.parse(fs.readFileSync(".netlify/state.json","utf8"));process.stdout.write(String(s.siteId||""))')"
if [[ -z "${SITE_ID}" ]]; then
  echo "Error: could not read Netlify siteId from .netlify/state.json"
  exit 1
fi

echo "Deploying to Netlify..."
NETLIFY_WAIT_SECONDS="${NETLIFY_WAIT_SECONDS:-300}"

set +e
NETLIFY_CLI_TELEMETRY_DISABLED=1 netlify deploy --prod --no-build --dir dist --functions netlify/functions --site "${SITE_ID}" --message "${MESSAGE}" --timeout 120 &
DEPLOY_PID=$!

SECONDS_WAITED=0
while kill -0 "${DEPLOY_PID}" 2>/dev/null; do
  if (( SECONDS_WAITED >= NETLIFY_WAIT_SECONDS )); then
    kill "${DEPLOY_PID}" 2>/dev/null || true
    wait "${DEPLOY_PID}" 2>/dev/null
    echo ""
    echo "Error: Netlify CLI did not finish within ${NETLIFY_WAIT_SECONDS}s."
    echo "The upload may have completed, but the CLI can hang while waiting for deploy status when the Netlify API is rate-limited."
    echo "Try again after a few minutes, or set NETLIFY_WAIT_SECONDS to a larger value if you know the deploy is still progressing."
    exit 124
  fi

  sleep 5
  SECONDS_WAITED=$((SECONDS_WAITED + 5))
done

wait "${DEPLOY_PID}"
DEPLOY_STATUS=$?
set -e
exit "${DEPLOY_STATUS}"
