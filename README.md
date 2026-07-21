# GameBar

GameBar è un progetto universitario basato su architettura a microservizi per gestire partite, utenti, statistiche e sensori in tempo reale per giochi da tavolo come calciobalilla, freccette, bocce e bowling.

## Obiettivo del progetto

Il sistema mostra come integrare:
- un frontend web semplice e pubblico;
- servizi backend separati per utenti, partite, tornei, statistiche e gestione giochi;
- un broker MQTT per aggiornamenti in tempo reale;
- un database PostgreSQL per la persistenza dei dati;
- una demo pronta da avviare con npm start.

## Architettura generale

- Frontend: interfaccia web statica in [frontend](frontend)
- Microservizi: cartella [backend](backend)
- Broker MQTT: configurazione in [infrastructure/mosquitto](infrastructure/mosquitto)
- Database: PostgreSQL con inizializzazione in [infrastructure/postgres](infrastructure/postgres)

## Servizi principali

| Servizio | Porta | Responsabilità |
| --- | --- | --- |
| User service | 3001 | autenticazione e gestione utenti |
| Game service | 3002 | giochi e location |
| Match service | 3003 | partite e flusso eventi |
| Tournament service | 3004 | tornei |
| Statistics service | 3005 | statistiche e classifiche |
| Frontend | 8000 | interfaccia web |

## Tecnologie usate

- Node.js + Express
- PostgreSQL + Sequelize
- MQTT con Mosquitto
- Docker + Docker Compose
- HTML/CSS/JavaScript per il frontend

## Struttura principale

- [backend](backend): microservizi principali
- [frontend](frontend): interfaccia utente
- [infrastructure](infrastructure): configurazioni di rete, database e broker
- [simulator](simulator): script per simulare eventi di gioco
- [sensor-simulator](sensor-simulator): simulatore di sensori

## Avvio rapido

1. Installa le dipendenze:
   ```bash
   npm run install:all
   ```

2. Configura l'ambiente:
   - copia `.env.example` in `.env`
   - aggiorna i valori se necessario
   - usa `.env` solo in locale: il file è già escluso dal repository

3. Avvia la demo con il metodo principale:
   ```bash
   npm start
   ```

4. Apri il frontend su:
   ```text
   http://localhost:8000
   ```

5. Opzionale: se Docker è disponibile, puoi avviare anche con Docker Compose:
   ```bash
   docker compose up --build
   ```

> Nota: se Docker non è installato sul tuo computer, usa il metodo principale con `npm start`.

## Funzionalità principali

- registrazione e autenticazione utenti con ruoli distinti (Giocatore, Amministratore locale, Amministratore gioco, Amministratore piattaforma);
- gestione dei giochi disponibili;
- risultati live per calcetto, freccette, bocce e bowling;
- registrazione automatica delle partite finite;
- aggiornamenti in tempo reale tramite MQTT;
- elaborazione di statistiche e classifiche.

## Dati di test

- Utente standard: `luigiverdi@example.com` / `luigi123!`
- Admin locale: `local@admin.com` / `admin123!`
- Admin gioco: `game@admin.com` / `admin123!`
- Admin piattaforma: `platform@admin.com` / `admin123!`

## Ruoli utente

- Giocatore: si registra, partecipa alle partite, ai giochi disponibili e ai tornei aperti, visualizza dashboard, classifica e risultati live.
- Amministratore locale: controlla i giochi e lo stato del proprio locale.
- Amministratore gioco: monitora un gioco specifico e gli eventi generati dal sistema.
- Amministratore piattaforma: verifica lo stato generale dei servizi e supervisiona la demo.

## Simulazione sensori

Il simulatore MQTT in [sensor-simulator](sensor-simulator) può essere usato per generare eventi fittizi di partita. È utile per la demo perché mostra il flusso realtime senza dover inserire manualmente gli eventi.


## Punti da esporre all'esame

- architettura a microservizi;
- separazione dei servizi per responsabilità;
- integrazione tra API REST e messaggistica MQTT;
- uso di container per rendere l'ambiente riproducibile;
- valore didattico del progetto come esempio di sistema distribuito.

