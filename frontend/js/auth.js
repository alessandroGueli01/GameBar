const auth = {
    async login(email, password) {
        const feedback = document.getElementById('auth-feedback');
        if (feedback) feedback.innerHTML = '<div class="alert alert-info py-2">Accesso in corso...</div>';

        try {
            const res = await api.request(`${CONFIG.AUTH_BASE}/login`, 'POST', { email, password });
            if (res.token) {
                this.completeLogin(res.user, res.token);
            } else {
                throw new Error('Login non riuscito');
            }
        } catch (e) {
            if (feedback) feedback.innerHTML = '<div class="alert alert-danger py-2">Credenziali non valide o backend non raggiungibile.</div>';
            console.warn('Errore di login:', e);
        }
    },

    completeLogin(user, token) {
        localStorage.setItem('cgp_token', token);
        localStorage.setItem('cgp_user', JSON.stringify(user));
        window.location.reload();
    },

    logout() {
        localStorage.clear();
        window.location.reload();
    },

    checkAuth() {
        const user = localStorage.getItem('cgp_user');
        if (user) {
            const currentUser = JSON.parse(user);
            const roleLabels = {
                PLAYER: 'Giocatore',
                LOCATION_ADMIN: 'Amministratore locale',
                GAME_ADMIN: 'Amministratore del gioco',
                PLATFORM_ADMIN: 'Amministratore della piattaforma'
            };
            const roleLabel = roleLabels[currentUser.role] ? ` (${roleLabels[currentUser.role]})` : '';
            const isAdmin = currentUser.role !== 'PLAYER';

            document.getElementById('auth-section').classList.add('d-none');
            document.getElementById('main-nav').classList.remove('d-none');
            document.getElementById('dashboard').classList.remove('d-none');
            if (isAdmin) {
                document.getElementById('admin-nav-item').classList.remove('d-none');
            }
            document.getElementById('user-display').innerText = `${currentUser.username}${roleLabel}`;
            app.init();
        }
    }
};

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    auth.login(email, pass);
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feedback = document.getElementById('auth-feedback');
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        await api.request(`${CONFIG.AUTH_BASE}/register`, 'POST', { username, email, password });
        if (feedback) feedback.innerHTML = '<div class="alert alert-success py-2">Registrazione completata. Ora puoi accedere.</div>';
        document.getElementById('register-form').reset();
    } catch (error) {
        if (feedback) feedback.innerHTML = `<div class="alert alert-danger py-2">Registrazione non riuscita: ${error.message}</div>`;
    }
});

window.onload = auth.checkAuth;