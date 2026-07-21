# Guida pratica alla relazione di GameBar

Questo file ti dice cosa scrivere nella relazione finale del progetto GameBar e quali diagrammi puoi inserire in plain text.

## Prima regola

La relazione deve descrivere il progetto reale presente nel repository.

Quindi:
- usa PostgreSQL come database;
- usa MQTT come canale realtime;
- usa Nginx come gateway/reverse proxy;
- usa Node.js + Express per i microservizi;
- non descrivere MongoDB, a meno che tu non lo citi come idea iniziale poi non adottata.

## Struttura consigliata della relazione

Puoi fare una relazione di 8-12 pagine con questa struttura.

## 1. Introduzione

In questa sezione devi spiegare:
- che cos'e GameBar;
- quale problema risolve;
- perche e stato scelto un approccio a microservizi.

Testo guida:

"GameBar e una piattaforma software per la gestione di giochi e partite in un contesto connesso, con supporto a utenti, tornei, statistiche e aggiornamenti realtime. Il progetto e stato sviluppato con un'architettura a microservizi per separare le responsabilita applicative, migliorare la modularita del codice e rendere piu chiara la gestione dei diversi domini del sistema."

## 2. Obiettivi del progetto

Qui devi spiegare cosa volevi ottenere.

Scrivi questi punti:
- gestione degli utenti con ruoli diversi;
- gestione dei giochi e delle location;
- gestione delle partite;
- aggiornamento realtime degli eventi di gioco;
- raccolta di statistiche;
- possibilita di eseguire il sistema in locale o con Docker.

Testo guida:

"L'obiettivo del progetto e realizzare un sistema distribuito in grado di coordinare piu servizi specializzati: autenticazione utenti, gestione dei giochi, gestione delle partite, organizzazione dei tornei e produzione di statistiche. Un ulteriore obiettivo e mostrare l'integrazione tra API REST e messaggistica MQTT per simulare un contesto vicino ai sistemi IoT e agli aggiornamenti in tempo reale."

## 3. Architettura generale

Questa e una delle sezioni piu importanti. Devi spiegare come e fatto il sistema.

Devi descrivere:
- frontend web;
- Nginx come punto di ingresso;
- microservizi backend;
- broker MQTT;
- database PostgreSQL;
- simulatori per generare eventi.

### Diagramma 1: architettura generale in plain text

```text
                        +----------------------+
                        |      Frontend        |
                        | HTML / CSS / JS      |
                        +----------+-----------+
                                   |
                                   v
                        +----------------------+
                        |    Nginx Gateway     |
                        | reverse proxy / API  |
                        +----+----+----+----+--+
                             |    |    |    |
              +--------------+    |    |    +----------------+
              |                   |    |                     |
              v                   v    v                     v
     +----------------+  +----------------+  +----------------------+
     | User Service   |  | Game Service   |  | Match Service        |
     | utenti, login  |  | giochi, locali |  | partite, eventi live |
     +--------+-------+  +--------+-------+  +-----+-----------+----+
              |                   |                |           |
              |                   |                |           v
              |                   |                |   +----------------+
              |                   |                |   | MQTT Broker    |
              |                   |                |   | Mosquitto      |
              |                   |                |   +--------+-------+
              |                   |                |            |
              v                   v                v            v
       +---------------------------------------------------------------+
       |                         PostgreSQL                            |
       | user_db, game_db, match_db, tournament_db, statistics_db     |
       +---------------------------------------------------------------+

                         +----------------------+
                         | Tournament Service   |
                         | gestione tornei      |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | Statistics Service   |
                         | statistiche/ranking  |
                         +----------------------+

                         +----------------------+
                         | Sensor Simulator     |
                         | eventi di gioco      |
                         +----------+-----------+
                                    |
                                    v
                               MQTT Broker
```

Testo guida:

"L'architettura di GameBar e basata su componenti debolmente accoppiati. Il frontend interagisce con il sistema tramite Nginx, che inoltra le richieste ai microservizi corretti. Ogni microservizio gestisce un dominio applicativo specifico e utilizza PostgreSQL per la persistenza. Il Match Service e inoltre collegato a un broker MQTT, utile per ricevere o distribuire eventi di gioco in tempo reale, anche tramite simulatori."

## 4. Descrizione dei microservizi

Qui devi dedicare un sottoparagrafo a ogni servizio.

### 4.1 User Service

Scrivi:
- gestisce registrazione e autenticazione;
- gestisce i ruoli utente;
- espone endpoint REST per gli utenti.

### 4.2 Game Service

Scrivi:
- gestisce giochi e location;
- mantiene le informazioni sui tavoli o dispositivi di gioco.

### 4.3 Match Service

Scrivi:
- gestisce l'avvio, l'aggiornamento e la chiusura delle partite;
- riceve eventi MQTT;
- coordina il flusso realtime.

### 4.4 Tournament Service

Scrivi:
- organizza i tornei;
- tiene traccia delle informazioni relative alle competizioni.

### 4.5 Statistics Service

Scrivi:
- raccoglie dati aggregati;
- produce classifiche e statistiche utili alla dashboard o alla reportistica.

### Diagramma 2: responsabilita dei servizi

```text
+----------------------+---------------------------------------------+
| Servizio             | Responsabilita principali                   |
+----------------------+---------------------------------------------+
| User Service         | registrazione, login, ruoli                |
| Game Service         | giochi, tavoli, location                   |
| Match Service        | partite, punteggi, eventi live, MQTT       |
| Tournament Service   | creazione e gestione tornei                |
| Statistics Service   | ranking, metriche, statistiche aggregate   |
+----------------------+---------------------------------------------+
```

## 5. Flusso operativo di una partita

Qui devi raccontare cosa succede quando viene giocata una partita.

Devi spiegare un flusso simile a questo:
1. un utente accede al frontend;
2. il frontend richiama le API tramite Nginx;
3. il Match Service crea o aggiorna una partita;
4. il simulatore o un dispositivo invia eventi al broker MQTT;
5. il Match Service riceve gli eventi e aggiorna lo stato;
6. i dati vengono salvati nel database;
7. le statistiche vengono aggiornate.

### Diagramma 3: sequenza semplificata in plain text

```text
Utente        Frontend        Nginx        Match Service      MQTT Broker     Statistics Service   PostgreSQL
  |              |              |                |                |                  |                |
  | avvia match  |              |                |                |                  |                |
  |------------->|              |                |                |                  |                |
  |              | richiesta    |                |                |                  |                |
  |              |------------->| inoltro        |                |                  |                |
  |              |              |--------------->| crea partita   |                  |                |
  |              |              |                |--------------->| subscribe/eventi |                |
  |              |              |                |                |                  |                |
  |              |              |                | riceve evento  |<-----------------| simulazione     |
  |              |              |                | aggiorna stato |                  |                |
  |              |              |                |-----------------------------------------------> salva
  |              |              |                |-------------------------------> aggiorna stats |
  |              | risposta     |<---------------|                                    |            |
  |<-------------|<-------------|                |                                    |            |
```

Testo guida:

"Il caso d'uso principale del sistema e la gestione di una partita con aggiornamento realtime. Il frontend invia le richieste applicative ai servizi backend tramite Nginx. Durante la partita, gli eventi possono essere prodotti da un simulatore o da dispositivi connessi e inviati al broker MQTT. Il Match Service riceve questi eventi, aggiorna lo stato della partita e salva le informazioni persistenti, che possono poi essere usate dal servizio statistiche."

## 6. Tecnologie usate e motivazioni

Qui devi spiegare non solo quali tecnologie hai usato, ma perche.

Usa questa tabella.

```text
+----------------+--------------------------------------------------+
| Tecnologia     | Motivazione                                      |
+----------------+--------------------------------------------------+
| Node.js        | sviluppo rapido di servizi backend REST          |
| Express        | struttura semplice per routing e controller      |
| PostgreSQL     | persistenza relazionale affidabile               |
| MQTT           | gestione leggera degli eventi realtime           |
| Nginx          | gateway unico e instradamento delle richieste    |
| Docker         | portabilita e riproducibilita dell'ambiente      |
| HTML/CSS/JS    | frontend leggero e facile da dimostrare          |
+----------------+--------------------------------------------------+
```

## 7. Struttura del progetto

Qui puoi spiegare com'e organizzato il repository.

### Diagramma 4: struttura semplificata delle cartelle

```text
GameBar/
|- backend/
|  |- user-service/
|  |- game-service/
|  |- match-service/
|  |- tournament-service/
|  `- statistics-service/
|- frontend/
|- infrastructure/
|  |- nginx/
|  |- mosquitto/
|  `- postgres/
|- sensor-simulator/
|- simulator/
`- docs/
```

Testo guida:

"La struttura del repository riflette la suddivisione logica del sistema. La cartella backend contiene i microservizi, frontend contiene l'interfaccia web, infrastructure raccoglie i file di configurazione dell'ambiente, mentre simulator e sensor-simulator permettono di testare il comportamento realtime del sistema."

## 8. Vantaggi dell'architettura scelta

Qui devi fare un po' di analisi, non solo descrizione.

Scrivi questi vantaggi:
- separazione delle responsabilita;
- maggiore modularita;
- facilita di manutenzione;
- possibilita di estendere nuovi servizi;
- integrazione naturale con componenti realtime.

Puoi usare questo testo:

"L'adozione di una architettura a microservizi rende il sistema piu chiaro da progettare e da mantenere, perche ogni servizio ha un dominio ben definito. Inoltre la presenza di MQTT permette di rappresentare in modo efficace gli scenari in cui i dati cambiano in tempo reale, come nel caso dei dispositivi di gioco connessi."

## 9. Limiti del progetto

Questa sezione migliora la qualita della relazione perche mostra consapevolezza tecnica.

Scrivi possibili limiti reali:
- testing automatico migliorabile;
- sicurezza migliorabile in uno scenario production;
- frontend dimostrativo e non industriale;
- orchestrazione semplice rispetto a piattaforme cloud reali;
- gestione observability non completa.

Testo guida:

"Essendo un progetto dimostrativo e didattico, GameBar privilegia la chiarezza architetturale rispetto alla completezza enterprise. Alcuni aspetti, come observability avanzata, test automatici estesi, hardening di sicurezza e deployment su larga scala, possono essere considerati sviluppi futuri."

## 10. Conclusioni

Qui devi chiudere valorizzando il progetto.

Testo guida:

"GameBar rappresenta un esempio concreto di applicazione distribuita basata su microservizi, utile per mostrare l'integrazione tra componenti REST, persistenza relazionale e messaggistica realtime. Il progetto dimostra come sia possibile organizzare un sistema modulare, estendibile e adatto a scenari di monitoraggio e gestione di eventi di gioco."

## Cosa conviene inserire sicuramente

Se vuoi una relazione completa, queste parti non devono mancare:
- introduzione;
- obiettivi;
- architettura generale;
- descrizione dei microservizi;
- flusso di una partita;
- tecnologie e motivazioni;
- vantaggi e limiti;
- conclusioni.

## Cosa puoi evitare

Puoi evitare:
- dettagli troppo bassi di ogni singolo endpoint;
- codice sorgente lungo;
- spiegazioni troppo teoriche sui microservizi;
- diagrammi grafici complessi se il docente accetta plain text.

## Ordine pratico di lavoro

Per scrivere la relazione senza perderti, fai cosi:
1. scrivi introduzione e obiettivi;
2. inserisci il diagramma generale;
3. descrivi i 5 microservizi;
4. aggiungi il flusso di una partita con il diagramma di sequenza;
5. inserisci tecnologie e motivazioni;
6. chiudi con vantaggi, limiti e conclusioni.

## Nota importante sulla coerenza

Se usi come supporto la documentazione gia presente nel progetto, controlla sempre che sia coerente con il repository attuale. Per la relazione finale fai riferimento soprattutto a:
- README.md;
- docker-compose.yml;
- backend/*-service;
- sensor-simulator;
- frontend.

Se vuoi, il passo successivo puo essere la creazione di una relazione completa gia scritta in stile accademico partendo da questa guida.