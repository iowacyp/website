#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: npm run deploy -- \"Commit message\" [--include-new]"
  echo ""
  echo "Default behavior:"
  echo "  - Runs npm run build"
  echo "  - Stages tracked changes plus dist/ and netlify.toml"
  echo "  - Commits and pushes to origin/main"
  echo "  - Waits for Netlify production deploy tied to that commit"
  echo ""
  echo "Use --include-new to stage all untracked files too."
  exit 0
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "Error: Netlify CLI is required. Install with: npm i -g netlify-cli"
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${BRANCH}" != "main" ]]; then
  echo "Error: deploy script must run from main. Current branch: ${BRANCH}"
  exit 1
fi

MESSAGE="${1:-Deploy: $(date '+%Y-%m-%d %H:%M')}"
INCLUDE_NEW="${2:-}"

if [[ -n "${INCLUDE_NEW}" && "${INCLUDE_NEW}" != "--include-new" ]]; then
  echo "Error: second argument must be --include-new or omitted."
  exit 1
fi

echo "Building site..."
npm run build

echo "Staging files..."
git add -u
git add dist netlify.toml

if [[ "${INCLUDE_NEW}" == "--include-new" ]]; then
  git add -A
fi

if git diff --cached --quiet; then
  echo "No staged changes to deploy."
  exit 0
fi

echo "Committing..."
git commit -m "${MESSAGE}"

echo "Pushing to GitHub..."
git push origin main

SITE_ID="$(node -e 'const fs=require("fs");const s=JSON.parse(fs.readFileSync(".netlify/state.json","utf8"));process.stdout.write(String(s.siteId||""))')"
if [[ -z "${SITE_ID}" ]]; then
  echo "Pushed to GitHub, but could not read Netlify siteId from .netlify/state.json"
  exit 0
fi

COMMIT_SHA="$(git rev-parse HEAD)"
echo "Waiting for Netlify production deploy for commit ${COMMIT_SHA}..."

ATTEMPTS=60
SLEEP_SECONDS=5
for ((i=1; i<=ATTEMPTS; i++)); do
  DEPLOY_JSON="$(netlify api listSiteDeploys --data "{\"site_id\":\"${SITE_ID}\",\"per_page\":20}")"
  MATCH="$(node -e '
const deploys = JSON.parse(process.argv[1]);
const sha = process.argv[2];
const match = deploys.find((d) => d.commit_ref === sha && d.context === "production");
if (!match) process.exit(2);
process.stdout.write(JSON.stringify({
  id: match.id || "",
  state: match.state || "",
  url: match.ssl_url || match.deploy_ssl_url || "",
  published_at: match.published_at || ""
}));
' "${DEPLOY_JSON}" "${COMMIT_SHA}" 2>/dev/null || true)"

  if [[ -z "${MATCH}" ]]; then
    sleep "${SLEEP_SECONDS}"
    continue
  fi

  STATE="$(node -e 'const m=JSON.parse(process.argv[1]);process.stdout.write(m.state||"")' "${MATCH}")"
  DEPLOY_ID="$(node -e 'const m=JSON.parse(process.argv[1]);process.stdout.write(m.id||"")' "${MATCH}")"
  DEPLOY_URL="$(node -e 'const m=JSON.parse(process.argv[1]);process.stdout.write(m.url||"")' "${MATCH}")"

  if [[ "${STATE}" == "ready" ]]; then
    echo "Netlify deploy ready: ${DEPLOY_ID}"
    echo "Production URL: ${DEPLOY_URL}"
    exit 0
  fi

  if [[ "${STATE}" == "error" || "${STATE}" == "failed" ]]; then
    echo "Netlify deploy failed: ${DEPLOY_ID}"
    echo "Check deploy logs in Netlify."
    exit 1
  fi

  sleep "${SLEEP_SECONDS}"
done

echo "Timed out waiting for Netlify deploy. GitHub push succeeded."
echo "Check deploy status in Netlify dashboard."
exit 0
