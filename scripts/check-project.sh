#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Verifica progetto GameBar"
echo "========================"

REQUIRED_FILES=(
  "README.md"
  "docker-compose.yml"
  "frontend/index.html"
  "frontend/js/app.js"
  "frontend/js/api.js"
  "frontend/js/auth.js"
  "backend/user-service/index.js"
  "backend/game-service/index.js"
  "backend/match-service/index.js"
  "backend/tournament-service/index.js"
  "backend/statistics-service/index.js"
  "infrastructure/nginx/nginx.conf"
  ".env.example"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "[OK] $file"
  else
    echo "[MISSING] $file"
    exit 1
  fi
done

echo "Controllo sintassi JavaScript..."
find backend frontend \( -path '*/node_modules/*' -o -path '*/dist/*' \) -prune -o -name '*.js' -print0 | xargs -0 -n1 node --check

echo "Controllo Docker..."
if command -v docker >/dev/null 2>&1; then
  docker compose config >/dev/null
  echo "[OK] Docker disponibile"
else
  echo "[WARN] Docker non disponibile in questo ambiente"
fi

echo "========================"
echo "Verifica completata"
