#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p "$ROOT_DIR/logs"

start_service() {
  local port="$1"
  local dir="$2"
  local log="$3"
  local command="$4"

  if lsof -ti ":$port" >/dev/null 2>&1; then
    echo "[OK] $dir già in esecuzione sulla porta $port"
    return 0
  fi

  echo "Avvio $dir sulla porta $port..."
  (
    cd "$ROOT_DIR/$dir"
    eval "$command" >"$log" 2>&1
  ) &

  sleep 2
  if curl -s "http://localhost:$port/health" >/dev/null 2>&1 || curl -s "http://localhost:$port/" >/dev/null 2>&1; then
    echo "[OK] $dir avviato"
  else
    echo "[WARN] $dir avviato ma non ancora pronto"
  fi
}

start_service 3001 "backend/user-service" "$ROOT_DIR/logs/user-service.log" "npm start"
start_service 3002 "backend/game-service" "$ROOT_DIR/logs/game-service.log" "npm start"
start_service 3003 "backend/match-service" "$ROOT_DIR/logs/match-service.log" "npm start"
start_service 3004 "backend/tournament-service" "$ROOT_DIR/logs/tournament-service.log" "npm start"
start_service 3005 "backend/statistics-service" "$ROOT_DIR/logs/statistics-service.log" "npm start"

if lsof -ti :8000 >/dev/null 2>&1; then
  echo "[OK] frontend già disponibile su http://localhost:8000"
else
  echo "Avvio frontend su http://localhost:8000..."
  (cd "$ROOT_DIR/frontend" && python3 -m http.server 8000 >"$ROOT_DIR/logs/frontend.log" 2>&1) &
  sleep 2
  echo "[OK] frontend disponibile su http://localhost:8000"
fi

echo ""
echo "Demo pronta:"
echo "- Frontend: http://localhost:8000"
echo "- Health services: http://localhost:3001/health ... http://localhost:3005/health"
