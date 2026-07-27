/**
 * Edge UI Manager
 * Gestisce la UI per visualizzare:
 * - Stato connessione (online/offline)
 * - Partite offline
 * - Coda di sincronizzazione
 * - Stato della sincronizzazione
 */
class EdgeUIManager {
  constructor() {
    this.statusBadgeId = 'edge-status-badge';
    this.offlineStatsId = 'offline-stats-modal';
    this.init();
  }

  init() {
    // Crea badge di stato nella navbar
    this.createStatusBadge();
    
    // Crea modal per statistiche offline
    this.createOfflineStatsModal();

    // Aggiorna stato quando connessione cambia
    window.addEventListener('online', () => this.updateStatus());
    window.addEventListener('offline', () => this.updateStatus());

    // Aggiorna ogni 5 secondi se offline
    setInterval(() => {
      if (!navigator.onLine) {
        this.updateOfflineStats();
      }
    }, 5000);
  }

  /**
   * Crea badge di stato nella navbar
   */
  createStatusBadge() {
    const navbar = document.querySelector('.navbar-nav .me-auto');
    if (!navbar) return;

    // Crea container per status
    const statusContainer = document.createElement('li');
    statusContainer.className = 'nav-item ms-auto';
    statusContainer.innerHTML = `
      <a class="nav-link" href="#" onclick="edgeUI.showOfflineStats(); return false;" id="${this.statusBadgeId}">
        <span class="badge bg-success">
          <i class="bi bi-wifi"></i> Online
        </span>
      </a>
    `;

    navbar.parentElement.appendChild(statusContainer);
    this.updateStatus();
  }

  /**
   * Crea modal per statistiche offline
   */
  createOfflineStatsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = this.offlineStatsId;
    modal.tabIndex = '-1';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">📊 Stato Offline</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div id="offline-stats-content">
              <div class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Caricamento...</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
            <button type="button" class="btn btn-primary" id="force-sync-btn" onclick="edgeUI.forceSyncNow()">
              🔄 Sincronizza Ora
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = new bootstrap.Modal(modal);
  }

  /**
   * Aggiorna lo stato del badge
   */
  async updateStatus() {
    const badge = document.getElementById(this.statusBadgeId);
    if (!badge) return;

    if (navigator.onLine) {
      badge.innerHTML = `
        <span class="badge bg-success">
          <i class="bi bi-wifi"></i> Online
        </span>
      `;
    } else {
      const stats = await edgeMatchManager.getOfflineStats();
      const pending = stats.pendingSync || 0;
      
      badge.innerHTML = `
        <span class="badge bg-warning text-dark">
          <i class="bi bi-wifi-off"></i> Offline (${pending} in coda)
        </span>
      `;
    }
  }

  /**
   * Aggiorna statistiche offline
   */
  async updateOfflineStats() {
    const stats = await edgeMatchManager.getOfflineStats();
    const queue = await offlineStorage.getSyncQueue();
    
    const html = `
      <div class="row">
        <div class="col-md-6">
          <h6>📱 Stato Locale</h6>
          <div class="list-group">
            <div class="list-group-item">
              <strong>Partite Totali:</strong> ${stats.totalLocalMatches || 0}
            </div>
            <div class="list-group-item">
              <strong>Partite Attive:</strong> ${stats.activeMatches || 0}
              <span class="badge bg-info ms-2">in corso</span>
            </div>
            <div class="list-group-item">
              <strong>Partite Concluse:</strong> ${stats.finishedMatches || 0}
              <span class="badge bg-secondary ms-2">pronte per sync</span>
            </div>
            <div class="list-group-item">
              <strong>Partite Create Offline:</strong> ${stats.createdOffline || 0}
              <span class="badge bg-warning ms-2">⚠️</span>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <h6>🔄 Sincronizzazione</h6>
          <div class="list-group">
            <div class="list-group-item">
              <strong>In Coda di Sync:</strong> ${stats.pendingSync || 0}
              <span class="badge ${stats.pendingSync > 0 ? 'bg-danger' : 'bg-success'} ms-2">
                ${stats.pendingSync > 0 ? '⏳ in attesa' : '✅ tutto synced'}
              </span>
            </div>
            <div class="list-group-item">
              <strong>Operazioni API:</strong> ${queue.length}
              <span class="badge ${queue.length > 0 ? 'bg-danger' : 'bg-success'} ms-2">
                ${queue.length > 0 ? '⏳' : '✅'}
              </span>
            </div>
            <div class="list-group-item">
              <strong>Connessione:</strong>
              <span class="badge ${navigator.onLine ? 'bg-success' : 'bg-danger'} ms-2">
                ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <hr class="my-3">

      <h6>📋 Operazioni in Coda</h6>
      ${queue.length > 0 ? `
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Metodo</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              ${queue.map(op => `
                <tr>
                  <td><code>${op.endpoint.split('/').slice(-2).join('/')}</code></td>
                  <td><span class="badge bg-info">${op.method}</span></td>
                  <td><span class="badge bg-warning">⏳ in coda</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="alert alert-success">✅ Nessuna operazione in sospeso</div>
      `}

      <div class="alert alert-info mt-3">
        <strong>💡 Info:</strong> I dati offline verranno sincronizzati automaticamente quando ritorna la connessione.
        ${!navigator.onLine ? 'Oppure clicca il pulsante "Sincronizza Ora".' : ''}
      </div>
    `;

    document.getElementById('offline-stats-content').innerHTML = html;
  }

  /**
   * Mostra modal con statistiche offline
   */
  async showOfflineStats() {
    await this.updateOfflineStats();
    this.modal.show();
  }

  /**
   * Forza sincronizzazione immediata
   */
  async forceSyncNow() {
    const btn = document.getElementById('force-sync-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Sincronizzazione...';

    try {
      await offlineSynchronizer.syncData();
      btn.innerHTML = '✅ Sincronizzato!';
      
      // Aggiorna statistiche
      setTimeout(() => {
        this.updateOfflineStats();
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 1500);
    } catch (error) {
      console.error('[EdgeUI] Errore sync forzato:', error);
      btn.innerHTML = '❌ Errore sync';
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
  }
}

// Esporta singleton
const edgeUI = new EdgeUIManager();
