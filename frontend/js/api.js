const api = {
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
            const response = await fetch(url, options);
            if (response.status === 401) auth.logout();

            const contentType = response.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : 'Errore del server');
            }

            // Salva in cache offline per GET
            if (method === 'GET' && offlineStorage?.db) {
                const storeName = api.getStoreNameFromUrl(url);
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