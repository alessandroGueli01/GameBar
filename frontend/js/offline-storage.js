/**
 * IndexedDB manager per cache offline
 * Salva dati localmente e sincronizza quando online
 */
class OfflineStorage {
  constructor() {
    this.dbName = 'GameBar-DB';
    this.version = 1;
    this.db = null;
    this.syncQueue = [];
  }

  // Inizializza il database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineStorage] DB inizializzato');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store per utenti
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // Store per partite
        if (!db.objectStoreNames.contains('games')) {
          db.createObjectStore('games', { keyPath: 'id' });
        }

        // Store per match
        if (!db.objectStoreNames.contains('matches')) {
          db.createObjectStore('matches', { keyPath: 'id' });
        }

        // Store per tornei
        if (!db.objectStoreNames.contains('tournaments')) {
          db.createObjectStore('tournaments', { keyPath: 'id' });
        }

        // Store per statistiche
        if (!db.objectStoreNames.contains('statistics')) {
          db.createObjectStore('statistics', { keyPath: 'id' });
        }

        // Store per coda di sincronizzazione
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }

        console.log('[OfflineStorage] Schema inizializzato');
      };
    });
  }

  // Salva dati in uno store
  async save(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(data);
    });
  }

  // Carica dati da uno store
  async load(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Carica tutti i dati da uno store
  async loadAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Elimina un elemento
  async delete(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Svuota uno store
  async clear(storeName) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Aggiungi operazione alla coda di sincronizzazione
  async queueSync(endpoint, method, data) {
    const operation = {
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      synced: false
    };

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.add(operation);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Ottieni coda di sincronizzazione
  async getSyncQueue() {
    return this.loadAll('syncQueue');
  }

  // Rimuovi operazione dalla coda
  async removeSyncQueueItem(id) {
    return this.delete('syncQueue', id);
  }

  // Pulisci coda di sincronizzazione
  async clearSyncQueue() {
    return this.clear('syncQueue');
  }
}

// Esporta singleton
const offlineStorage = new OfflineStorage();
