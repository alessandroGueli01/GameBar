const api = {
    isLikelyHtmlResponse(data) {
        if (typeof data !== 'string') return false;
        const trimmed = data.trim();
        return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html');
    },

    buildTournamentFallbackUrl(url) {
        if (!url.includes('/api/tournaments')) return null;
        if (url.startsWith('http://localhost:3004/')) return null;
        return url.replace(/^https?:\/\/[^/]+/, 'http://localhost:3004');
    },

    async fetchJsonOrText(url, options) {
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
            ? await response.json()
            : await response.text();
        return { response, data };
    },

    formatErrorMessage(data, statusCode) {
        if (typeof data === 'string') {
            const trimmed = data.trim();
            if (api.isLikelyHtmlResponse(trimmed)) {
                return `Errore ${statusCode}: risposta non valida dal server.`;
            }
            return trimmed.length > 200 ? `${trimmed.slice(0, 200)}...` : trimmed;
        }

        if (data && typeof data === 'object') {
            return data.error || data.message || data.details || `Errore del server (${statusCode})`;
        }

        return `Errore del server (${statusCode})`;
    },

    async request(url, method = 'GET', body = null) {
        const token = localStorage.getItem('cgp_token');
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        if (body) options.body = JSON.stringify(body);

        try {
            let usedUrl = url;
            let { response, data } = await api.fetchJsonOrText(usedUrl, options);

            // Fallback: se i tornei rispondono HTML 404/501 (tipico di porta frontend senza proxy), ritenta sul servizio diretto.
            if (!response.ok && api.isLikelyHtmlResponse(data) && (response.status === 404 || response.status === 501)) {
                const fallbackUrl = api.buildTournamentFallbackUrl(usedUrl);
                if (fallbackUrl) {
                    console.warn(`[API] Fallback tornei: ${usedUrl} -> ${fallbackUrl}`);
                    usedUrl = fallbackUrl;
                    ({ response, data } = await api.fetchJsonOrText(usedUrl, options));
                }
            }

            if (response.status === 401) auth.logout();

            if (!response.ok) {
                throw new Error(api.formatErrorMessage(data, response.status));
            }

            // Salva in cache offline per GET
            if (method === 'GET' && offlineStorage?.db) {
                const storeName = api.getStoreNameFromUrl(usedUrl);
                if (storeName && Array.isArray(data)) {
                    data.forEach(item => offlineStorage.save(storeName, item).catch(console.error));
                }
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);

            // Se offline e è una GET, tenta di leggere da cache
            if (method === 'GET' && !navigator.onLine && offlineStorage?.db) {
                console.log('[API] Utilizzo dati offline dalla cache');
                const storeName = api.getStoreNameFromUrl(url);
                if (storeName) {
                    const cachedData = await offlineStorage.loadAll(storeName).catch(() => []);
                    if (cachedData.length > 0) {
                        return cachedData;
                    }
                }
            }

            // Se offline e è POST/PUT/DELETE, metti in coda
            if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && !navigator.onLine && offlineStorage?.db) {
                console.log('[API] Richiesta messa in coda per sincronizzazione offline');
                await offlineSynchronizer.storage.queueSync(url, method, body).catch(console.error);
                return { queued: true, message: 'Sincronizzato quando online' };
            }

            throw error;
        }
    },

    getStoreNameFromUrl(url) {
        if (url.includes('/users')) return 'users';
        if (url.includes('/games')) return 'games';
        if (url.includes('/matches')) return 'matches';
        if (url.includes('/tournaments')) return 'tournaments';
        if (url.includes('/stats')) return 'statistics';
        return null;
    }
};