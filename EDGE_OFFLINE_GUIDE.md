# 🎮 Edge Offline Guide - Partite in Modalità Edge

## 📋 Panoramica

Il sistema GameBar implementa **Edge Computing** per le partite quando offline:

```
┌─────────────────────────────────────────┐
│     Modalità Edge Offline Partite       │
└─────────────────────────────────────────┘

┌──────────┐         ┌─────────────┐         ┌──────────┐
│ Utente   │────────▶│   Frontend  │────────▶│ Backend  │
│          │ Offline │   (Edge)    │ Online  │ (Server) │
└──────────┘         └─────────────┘         └──────────┘
                     • IndexedDB
                     • Service Worker
                     • Sync Queue
```

---

## 🎯 Flusso Partita Offline

### 1️⃣ Creazione Partita (Offline)

```javascript
// Utente crea una nuova partita mentre offline
const match = await edgeMatchManager.createMatch({
  gameId: 'foosball',
  teamA: 'Team A',
  teamB: 'Team B',
  location: 'Bar Centro'
});

// Risultato:
// ✅ Partita salvata in IndexedDB
// ✅ ID temporaneo generato (temp-TIMESTAMP-RANDOM)
// ✅ Flag isOfflineCreated = true
// 📌 In attesa di sincronizzazione quando online
```

**Dati Salvati Localmente:**
```json
{
  "id": "temp-1690000000000-abc123",
  "gameId": "foosball",
  "teamA": "Team A",
  "teamB": "Team B",
  "status": "ACTIVE",
  "createdAt": "2026-07-27T15:30:00Z",
  "synced": false,
  "isOfflineCreated": true,
  "events": []
}
```

---

### 2️⃣ Aggiunta Eventi Durante Partita (Offline)

```javascript
// Durante la partita, aggiungi eventi (goal, punti, etc.)
const event = await edgeMatchManager.addEvent('temp-1690000000000-abc123', {
  type: 'GOAL',
  team: 'A',
  player: 'Marco',
  score: { teamA: 1, teamB: 0 }
});

// Risultato:
// ✅ Evento aggiunto localmente
// ✅ Timestamp registrato automaticamente
// ✅ Partita marcata come modificata (synced: false)
```

**Evento Salvato:**
```json
{
  "id": "event-1690000000123",
  "type": "GOAL",
  "team": "A",
  "player": "Marco",
  "score": { "teamA": 1, "teamB": 0 },
  "timestamp": "2026-07-27T15:35:00Z",
  "synced": false
}
```

---

### 3️⃣ Conclusione Partita (Offline)

```javascript
// Quando la partita finisce, concludila
const finalMatch = await edgeMatchManager.endMatch(
  'temp-1690000000000-abc123',
  {
    finalScoreA: 10,
    finalScoreB: 8,
    winner: 'Team A'
  }
);

// Risultato:
// ✅ Partita marcata come FINISHED
// ✅ Orario fine registrato
// ✅ Spostata da active a pending
// 📌 Pronta per sincronizzazione quando online
```

**Partita Conclusa:**
```json
{
  "id": "temp-1690000000000-abc123",
  "status": "FINISHED",
  "finalScoreA": 10,
  "finalScoreB": 8,
  "winner": "Team A",
  "endedAt": "2026-07-27T15:45:00Z",
  "synced": false,
  "events": [
    { "id": "event-1", ... },
    { "id": "event-2", ... }
  ]
}
```

---

### 4️⃣ Sincronizzazione Automatica (Online)

Quando **ritorna la connessione**, il sistema:

```
1. Rileva online
   ↓
2. Sincronizzatore avvia
   ↓
3. Carica partite edge offline
   ↓
4. Per ogni partita creata offline:
   → Converte ID temporaneo in ID server
   → Invia POST /api/matches
   → Riceve nuovo ID dal server
   ↓
5. Per ogni partita modificata:
   → Invia PUT /api/matches/{id}
   ↓
6. Marca come synced = true
   ↓
7. Notifica completamento
```

---

## 🏗️ Architettura dei Dati

### IndexedDB Schema

```
Database: GameBar-DB

┌──────────────────────────────────┐
│ Object Stores                    │
├──────────────────────────────────┤
│ • matches                        │
│   ├─ id (string)                │
│   ├─ gameId                      │
│   ├─ teamA / teamB              │
│   ├─ events (array)             │
│   ├─ status (ACTIVE/FINISHED)   │
│   ├─ synced (boolean)           │
│   ├─ isOfflineCreated (boolean) │
│   └─ timestamps                  │
│                                  │
│ • syncQueue                      │
│   ├─ id (autoincrement)         │
│   ├─ endpoint                   │
│   ├─ method (POST/PUT/DELETE)   │
│   ├─ data (payload)             │
│   └─ timestamp                  │
│                                  │
│ • users, games, tournaments,    │
│   statistics (cache)             │
└──────────────────────────────────┘
```

---

## 📊 Monitoraggio dello Stato Offline

### UI di Stato

Nella navbar appare un badge che mostra:

```
🟢 Online                    (normale)
🔴 Offline (3 in coda)       (offline con dati da sincronizzare)
```

### Modal Statistiche

Clicca sul badge per visualizzare:

```
📱 Stato Locale
├─ Partite Totali: 5
├─ Partite Attive: 2
├─ Partite Concluse: 3
└─ Partite Create Offline: 2

🔄 Sincronizzazione
├─ In Coda di Sync: 3
├─ Operazioni API: 2
└─ Connessione: 🔴 Offline
```

### Sincronizzazione Manuale

```javascript
// Forza sincronizzazione immediata da console
await edgeMatchManager.syncPendingMatches();

// Oppure usa il pulsante nel modal UI
```

---

## 🔄 Flusso Completo Esempio

### Scenario: Partita di Calcetto Offline

```
15:25 - 🔴 OFFLINE
└─ Utente crea partita: Calcetto (ID temp: temp-1690000000000-abc)
   ✅ Salvata in IndexedDB
   
15:30 - Goal Team A
└─ Aggiunto evento (GOAL, Team A)
   ✅ Salvato in IndexedDB
   
15:35 - Goal Team B
└─ Aggiunto evento (GOAL, Team B)
   ✅ Salvato in IndexedDB
   
15:40 - Goal Team A (2-1)
└─ Aggiunto evento (GOAL, Team A)
   ✅ Salvato in IndexedDB
   
15:45 - Partita Conclusa (Team A vince 10-8)
└─ Partita conclusa
   ✅ Status: FINISHED
   ✅ Spostata a pending
   🔴 Ancora offline
   
15:50 - 🟢 ONLINE (ritorna connessione)
└─ Sincronizzatore avvia automaticamente
   ├─ POST /api/matches (con ID temp)
   │  └─ Server risponde con ID 12345
   ├─ Mappa ID: temp-abc → 12345
   ├─ PUT /api/matches/12345 (con dati finali e eventi)
   └─ ✅ Sincronizzazione completata!
   
15:51 - 🟢 ONLINE
└─ Partita visibile nel backend
   ✅ Risultato: 10-8 Team A
   ✅ Statistiche aggiornate
```

---

## 🛡️ Gestione Errori

### Sincronizzazione Fallita

Se durante la sincronizzazione avviene un errore:

```javascript
❌ POST /api/matches → Errore 500
   ↓
1. Operazione rimane in coda
2. Notifica all'utente: "Errore sincronizzazione"
3. Nuovo tentativo al prossimo online
4. Utente può forzare sync manualmente
```

### Conflitti Dati

Se lo stesso ID viene modificato online e offline:

```javascript
// Frontend offline modifica match XYZ
// Intanto, match XYZ viene modificato online

// Quando torna online:
1. System avvia sincronizzazione
2. Viene rilevato il conflitto
3. Policy: Last Write Wins (LWW)
   └─ Timestamp più recente prevalal'importanza che il sistema funzionante offline non deve preoccuparsi di conflitti
```

---

## 📱 API Edge Match Manager

### Metodi Principali

```javascript
// Crea partita offline
edgeMatchManager.createMatch({
  gameId: 'foosball',
  teamA: 'Team A',
  teamB: 'Team B',
  location: 'Bar'
})

// Aggiungi evento
edgeMatchManager.addEvent(matchId, {
  type: 'GOAL',
  team: 'A',
  player: 'Marco'
})

// Conclude partita
edgeMatchManager.endMatch(matchId, {
  finalScoreA: 10,
  finalScoreB: 8
})

// Ottieni partite attive
edgeMatchManager.getActiveMatches()

// Ottieni partite da sincronizzare
edgeMatchManager.getPendingMatches()

// Sincronizza manualmente
edgeMatchManager.syncPendingMatches()

// Statistiche offline
edgeMatchManager.getOfflineStats()
```

---

## ✅ Test Checklist

- [ ] Offline: Crea partita → ✅ Salvata localmente
- [ ] Offline: Aggiungi 3 eventi → ✅ Salvati localmente
- [ ] Offline: Concludi partita → ✅ Marcata come FINISHED
- [ ] Modal UI: Badge mostra correttamente stato offline
- [ ] Modal UI: Statistiche mostrano 1 partita in coda
- [ ] Online: Ritorna connessione → ✅ Auto-sync avvia
- [ ] Online: Partita visibile nel backend
- [ ] Online: Risultati e eventi sincronizzati
- [ ] Sync Manuale: Pulsante "Sincronizza Ora" funziona
- [ ] Badge: Cambia da offline a online ✅

---

## 🚀 Miglioramenti Futuri

- [ ] Conflict resolution avanzato
- [ ] Replay offline di azioni MQTT
- [ ] Compressione dati offline
- [ ] Backup automatico su server secondario
- [ ] WebSocket upgrade per sync real-time

---

**🎮 GameBar è ora pronto per partite edge offline complete!**
