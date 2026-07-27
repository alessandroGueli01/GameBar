# 🚀 GameBar - Guida Offline Support

## ✅ Implementazione Completata

Il progetto GameBar ora supporta completamente la **modalità offline** sia nel backend che nel frontend!

### 📋 Cosa è stato implementato

#### Backend
- ✅ **MQTT Solo Locale**: Rimosso fallback a `test.mosquitto.org`, usa solo Mosquitto locale (`mqtt://mosquitto:1883`)
- ✅ **Docker Compose**: Tutto funziona in locale senza dipendenze esterne
- ✅ **Resilienza**: Riconnessione automatica al broker se offline

#### Frontend
- ✅ **Service Worker**: Cache automatico di asset e API calls
- ✅ **IndexedDB**: Salvataggio locale di dati (utenti, giochi, match, tornei, statistiche)
- ✅ **Sincronizzazione Offline**: Coda di richieste PUT/POST/DELETE quando offline
- ✅ **Notifiche in Tempo Reale**: Alert visivi quando la connessione cambia

---

## 🎯 Come Usare l'Offline Mode

### 1️⃣ Avviare Tutto in Local (Offline Ready)

```bash
cd /Users/alessandrogueli/Documents/3ANNO/GameBar
docker-compose up
```

**Nota**: Nessuna dipendenza esterna, tutto funziona localmente!

### 2️⃣ Testare la Modalità Offline

Aprire il browser e:

1. **Vai su**: http://localhost:8080
2. **Accedi** con un account
3. **Apri DevTools** (F12 → Application → Service Workers)
4. **Vai Offline**:
   - Firefox: Menu → Dev Tools → Network → throttling → Offline
   - Chrome: DevTools → Network → Throttling → Offline
5. **Continua a navigare**: I dati vengono letti dalla cache!

### 3️⃣ Modificare Dati Offline

Quando sei offline e fai:
- ✅ **GET**: Usa i dati in cache
- ⏳ **POST/PUT/DELETE**: Mette in coda, sincronizza quando online

Esempio:
```javascript
// Offline - va in coda
api.request(CONFIG.GAME_BASE, 'POST', { name: 'Calcetto' });
// Quando ritorna online → auto-sincronizzazione ✅
```

### 4️⃣ Sincronizzazione Manuale

```javascript
// Nel browser console:
await offlineSynchronizer.syncData();
// Sincronizza tutte le operazioni in coda
```

---

## 🏗️ Architettura

### File Aggiunti

| File | Descrizione |
|------|------------|
| `frontend/service-worker.js` | Cache offline e gestione rete |
| `frontend/js/offline-storage.js` | IndexedDB manager (utenti, giochi, match, etc.) |
| `frontend/js/offline-sync.js` | Sincronizzatore dati |
| `backend/match-service/mqttClient.js` | ✅ Aggiornato: solo MQTT locale |

### Flusso Dati

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ├─→ Fetch API (GET, POST, PUT, DELETE)
       │
       ├─→ Service Worker
       │   ├─ Cache Asset
       │   └─ Network-first per API
       │
       └─→ IndexedDB
           ├─ users
           ├─ games
           ├─ matches
           ├─ tournaments
           ├─ statistics
           └─ syncQueue ← Auto-sync quando online
```

---

## 📊 Stato dei Servizi

| Componente | Stato | Note |
|-----------|-------|------|
| PostgreSQL | ✅ Locale | Docker |
| Mosquitto MQTT | ✅ Locale | Docker, no fallback esterno |
| User Service | ✅ Offline | Cache + Sync |
| Game Service | ✅ Offline | Cache + Sync |
| Match Service | ✅ Offline | Cache + Sync + MQTT locale |
| Tournament Service | ✅ Offline | Cache + Sync |
| Statistics Service | ✅ Offline | Cache + Sync |
| Frontend | ✅ Offline | Service Worker + IndexedDB |

---

## 🔍 Debug

### Controllare IndexedDB
```javascript
// Browser console:
const all = await offlineStorage.loadAll('games');
console.log(all);
```

### Controllare Coda di Sync
```javascript
// Browser console:
const queue = await offlineStorage.getSyncQueue();
console.log('Operazioni in coda:', queue);
```

### Forzare Sincronizzazione
```javascript
// Browser console:
await offlineSynchronizer.syncData();
```

### Logs Service Worker
```javascript
// Browser console:
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations));
```

---

## ⚠️ Limitazioni Attuali

1. **Realtime MQTT**: Le notifiche in tempo reale non funzionano offline (normale, MQTT richiede connessione)
2. **Autenticazione**: Il token JWT è salvato in localStorage, valido mentre offline
3. **Sincronizzazione Automatica**: Avviene solo quando ritorna online (non pull attivo)

---

## 🚀 Miglioramenti Futuri (Opzionali)

- [ ] Push Notifications quando sync completato
- [ ] Conflict resolution per dati modificati online/offline
- [ ] Periodic Background Sync API
- [ ] WebSocket upgrade quando online
- [ ] Compression per dati offline

---

## ✅ Test Checklist

- [ ] Avvia `docker-compose up`
- [ ] Accedi all'app
- [ ] Vai offline (DevTools)
- [ ] Leggi i dati (GET) - ✅ Usa cache
- [ ] Modifica dati (POST) - ⏳ Va in coda
- [ ] Torna online
- [ ] Verifica auto-sync - ✅ Sincronizzato!
- [ ] Controlla notifiche - ✅ Alert mostrato

---

**📝 Nota**: Tutto il supporto offline è trasparente per l'utente. Non richiede cambiamenti nell'app logic!

**Domande?** Controlla i logs nella console del browser e dei servizi. 🎯
