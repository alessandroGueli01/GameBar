/**
 * Sincronizzatore offline - gestisce la sincronizzazione
 * dei dati quando ritorna la connessione
 */
class OfflineSynchronizer {
  constructor(storageManager) {
    this.storage = storageManager;
    this.isSyncing = false;
    this.onSyncComplete = null;
  }

  // Monitora la connessione e sincronizza quando ritorna
  init() {
    console.log('[Sync] Inizializzazione sincronizzatore offline');

    // Ascolta cambio di stato della connessione
    window.addEventListener('online', () => {
      console.log('[Sync] 🟢 Connessione ritornata');
      this.syncData();
    });

    window.addEventListener('offline', () => {
      console.log('[Sync] 🔴 Connessione persa');
      this.notifyOfflineStatus(true);
    });

    // Sync automatico al caricamento se online
    if (navigator.onLine) {
      setTimeout(() => this.syncData(), 1000);
    }
  }

  // Sincronizza tutti i dati in coda
  async syncData() {
    if (this.isSyncing) {
      console.log('[Sync] Sincronizzazione già in corso...');
      return;
    }

    this.isSyncing = true;
    this.notifyOfflineStatus(false);

    try {
      const queue = await this.storage.getSyncQueue();
      console.log(`[Sync] Elementi in coda: ${queue.length}`);

      // Prima sincronizza le partite edge offline
      if (typeof edgeMatchManager !== 'undefined') {
        console.log('[Sync] Sincronizzazione partite edge offline...');
        const matchStats = await edgeMatchManager.syncPendingMatches();
        console.log(`[Sync] Partite: ${matchStats.synced} sincronizzate, ${matchStats.failed} errori`);
      }

      if (queue.length === 0) {
        console.log('[Sync] Nessun dato da sincronizzare');
        this.isSyncing = false;
        return;
      }

      let syncedCount = 0;
      const errors = [];

      for (const operation of queue) {
        try {
          await this.executeSync(operation);
          await this.storage.removeSyncQueueItem(operation.id);
          syncedCount++;
          console.log(`[Sync] ✅ Sincronizzato: ${operation.endpoint}`);
        } catch (error) {
          console.error(`[Sync] ❌ Errore sincronizzazione: ${operation.endpoint}`, error);
          errors.push({ endpoint: operation.endpoint, error: error.message });
        }
      }

      console.log(`[Sync] Completato: ${syncedCount}/${queue.length} elementi`);
      this.notifySync(syncedCount, errors);

      if (this.onSyncComplete) {
        this.onSyncComplete(syncedCount, errors);
      }
    } catch (error) {
      console.error('[Sync] Errore durante sincronizzazione:', error);
      this.notifyError('Errore durante sincronizzazione');
    } finally {
      this.isSyncing = false;
    }
  }

  // Esegui singola operazione di sincronizzazione
  async executeSync(operation) {
    const options = {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (operation.data) {
      options.body = JSON.stringify(operation.data);
    }

    // Aggiungi token se disponibile
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(operation.endpoint, options);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Notifica stato offline/online
  notifyOfflineStatus(isOffline) {
    const message = isOffline
      ? '⚠️ Sei offline. I dati verranno sincronizzati quando ritorni online.'
      : '✅ Connessione ristabilita. Sincronizzazione in corso...';

    this.showNotification(message, isOffline ? 'warning' : 'success');
  }

  // Notifica risultato sincronizzazione
  notifySync(syncedCount, errors) {
    if (syncedCount > 0) {
      this.showNotification(
        `✅ Sincronizzati ${syncedCount} elementi`,
        'success'
      );
    }

    if (errors.length > 0) {
      this.showNotification(
        `⚠️ ${errors.length} errori durante sincronizzazione`,
        'error'
      );
    }

    // Aggiorna UI offline se disponibile
    if (typeof edgeUI !== 'undefined') {
      setTimeout(() => {
        edgeUI.updateStatus();
        edgeUI.updateOfflineStats();
      }, 500);
    }
  }

  // Mostra notifica
  showNotification(message, type = 'info') {
    // Dispatch evento personalizzato
    window.dispatchEvent(
      new CustomEvent('offline-notification', {
        detail: { message, type }
      })
    );

    // Log console
    console.log(`[Notification] ${message}`);
  }

  notifyError(message) {
    this.showNotification(`❌ ${message}`, 'error');
  }
}

// Esporta classe
const offlineSynchronizer = new OfflineSynchronizer(offlineStorage);
