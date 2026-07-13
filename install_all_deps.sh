#!/bin/bash

# Lista delle directory che contengono i microservizi Node.js
SERVICES=(
  "backend/user-service"
  "backend/game-service"
  "backend/match-service"
  "backend/tournament-service"
  "backend/statistics-service"
  "sensor-simulator"
)

echo "Avvio installazione massiva delle dipendenze..."

for service in "${SERVICES[@]}"; do
  if [ -d "$service" ]; then
    echo "----------------------------------------------------"
    echo "Installazione in: $service"
    (cd "$service" && npm install)
  else
    echo "Salto $service: directory non trovata."
  fi
done

echo "Operazione completata!"