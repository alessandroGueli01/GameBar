/**
 * Edge Match Manager
 * Gestisce le partite a livello edge quando offline
 * 
 * Flusso:
 * 1. Utente crea/modifica partita offline → salva in IndexedDB
 * 2. Sistema memorizza temporaneamente i dati
 * 3. Quando torna online → sincronizza automaticamente con server
 */
class EdgeMatchManager {
  constructor(storageManager, syncManager) {
    this.storage = storageManager;
    this.sync = syncManager;
    this.activeMatches = new Map(); // Partite in corso offline
    this.pendingMatches = new Map(); // Partite da sincronizzare
  }

  /**
   * Avvia una nuova partita (funziona offline)
   * Salva i dati localmente e mette in coda la sincronizzazione
   */
  async createMatch(matchData) {
    try {
      // Genera ID temporaneo se offline
      const id = matchData.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const match = {
        id,
        ...matchData,
        createdAt: new Date().toISOString(),
        synced: false,
        isOfflineCreated: !navigator.onLine, // Flag per indicare che è creata offline
        events: [],
        status: 'ACTIVE'
      };

      // Salva localmente
      await this.storage.save('matches', match);
      this.activeMatches.set(id, match);

      console.log(`[EdgeMatch] Partita creata: ${id} (Offline: ${match.isOfflineCreated})`);

      // Se online, sincronizza subito, altrimenti metti in coda
      if (navigator.onLine) {
        await this.queueMatchForSync(match, 'POST');
      } else {
        console.log(`[EdgeMatch] Partita in cache locale - sincronizzazione sospesa`);
      }

      return match;
    } catch (error) {
      console.error('[EdgeMatch] Errore creazione partita:', error);
      throw error;
    }
  }

  /**
   * Aggiungi evento a una partita (es. goal, punto)
   * Funziona completamente offline
   */
  async addEvent(matchId, eventData) {
    try {
      let match = this.activeMatches.get(matchId);
      
      if (!match) {
        match = await this.storage.load('matches', matchId);
      }

      if (!match) {
        throw new Error(`Partita non trovata: ${matchId}`);
      }

      const event = {
        id: `event-${Date.now()}`,
        ...eventData,
        timestamp: new Date().toISOString(),
        synced: false
      };

      // Aggiungi evento localmente
      if (!match.events) match.events = [];
      match.events.push(event);
      match.synced = false; // Marca come da sincronizzare

      // Salva aggiornamento
      await this.storage.save('matches', match);
      this.activeMatches.set(matchId, match);

      console.log(`[EdgeMatch] Evento aggiunto: ${matchId} - ${event.id}`);

      // Se online, sincronizza
      if (navigator.onLine) {
        await this.queueMatchForSync(match, 'PUT');
      }

      return event;
    } catch (error) {
      console.error('[EdgeMatch] Errore aggiunta evento:', error);
      throw error;
    }
  }

  /**
   * Conclude una partita
   * Salva i risultati finali localmente
   */
  async endMatch(matchId, finalData) {
    try {
      let match = this.activeMatches.get(matchId);
      
      if (!match) {
        match = await this.storage.load('matches', matchId);
      }

      if (!match) {
        throw new Error(`Partita non trovata: ${matchId}`);
      }

      // Aggiorna con dati finali
      match = {
        ...match,
        ...finalData,
        status: 'FINISHED',
        endedAt: new Date().toISOString(),
        synced: false
      };

      // Salva
      await this.storage.save('matches', match);
      this.activeMatches.delete(matchId); // Sposta da active a pending
      this.pendingMatches.set(matchId, match);

      console.log(`[EdgeMatch] Partita conclusa: ${matchId}`);

      // Se online, sincronizza subito
      if (navigator.onLine) {
        await this.queueMatchForSync(match, 'PUT');
      } else {
        console.log(`[EdgeMatch] Partita conclusa offline - pronta per sync`);
      }

      return match;
    } catch (error) {
      console.error('[EdgeMatch] Errore conclusione partita:', error);
      throw error;
    }
  }

  /**
   * Metti in coda una partita per la sincronizzazione
   */
  async queueMatchForSync(match, method = 'POST') {
    try {
      const syncData = {
        ...match,
        synced: false
      };

      await this.sync.storage.queueSync(
        `${CONFIG.MATCH_BASE}${method === 'POST' ? '' : `/${match.id}`}`,
        method,
        syncData
      );

      console.log(`[EdgeMatch] Partita in coda per sync: ${match.id}`);
    } catch (error) {
      console.error('[EdgeMatch] Errore coda sincronizzazione:', error);
    }
  }

  /**
   * Ottieni tutte le partite attive locali
   */
  async getActiveMatches() {
    try {
      return await this.storage.loadAll('matches');
    } catch (error) {
      console.error('[EdgeMatch] Errore caricamento partite:', error);
      return [];
    }
  }

  /**
   * Ottieni partite in attesa di sincronizzazione
   */
  async getPendingMatches() {
    return Array.from(this.pendingMatches.values())
      .filter(match => !match.synced);
  }

  /**
   * Sincronizza tutte le partite offline
   * Chiamato automaticamente quando ritorna online
   */
  async syncPendingMatches() {
    try {
      const pending = await this.getPendingMatches();
      console.log(`[EdgeMatch] Sincronizzazione ${pending.length} partite in sospeso...`);

      if (pending.length === 0) {
        console.log('[EdgeMatch] Nessuna partita da sincronizzare');
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (const match of pending) {
        try {
          // Se è creata offline, invia come POST
          const method = match.isOfflineCreated && !match.serverId ? 'POST' : 'PUT';
          
          await this.queueMatchForSync(match, method);
          
          // Marca come synced localmente
          match.synced = true;
          await this.storage.save('matches', match);
          
          synced++;
          console.log(`[EdgeMatch] ✅ Sincronizzata: ${match.id}`);
        } catch (error) {
          failed++;
          console.error(`[EdgeMatch] ❌ Errore sync: ${match.id}`, error);
        }
      }

      console.log(`[EdgeMatch] Sync completo: ${synced} sincronizzate, ${failed} errori`);
      return { synced, failed };
    } catch (error) {
      console.error('[EdgeMatch] Errore sincronizzazione massiva:', error);
      throw error;
    }
  }

  /**
   * Ottieni statistiche partite offline
   */
  async getOfflineStats() {
    try {
      const allMatches = await this.getActiveMatches();
      
      const stats = {
        totalLocalMatches: allMatches.length,
        activeMatches: allMatches.filter(m => m.status === 'ACTIVE').length,
        finishedMatches: allMatches.filter(m => m.status === 'FINISHED').length,
        pendingSync: allMatches.filter(m => !m.synced).length,
        createdOffline: allMatches.filter(m => m.isOfflineCreated).length
      };

      return stats;
    } catch (error) {
      console.error('[EdgeMatch] Errore statistiche:', error);
      return {};
    }
  }
}

// Esporta singleton
const edgeMatchManager = new EdgeMatchManager(offlineStorage, offlineSynchronizer);
