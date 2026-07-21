const app = {
    liveIntervalId: null,
    dashboardState: {
        games: [],
        matches: [],
        tournaments: [],
        leaderboard: []
    },
    recentMatches: [],
    getCurrentUser() {
        const currentUser = localStorage.getItem('cgp_user');
        return currentUser ? JSON.parse(currentUser) : null;
    },
    liveState: {
        games: [
            { id: 'calcetto', name: 'Calcetto', teamA: 'Team A', teamB: 'Team B', scoreA: 3, scoreB: 2, target: 10, unit: 'Goal', events: [{ time: 'Ora', text: 'Partita in corso: Team A in possesso' }] },
            { id: 'freccette', name: 'Freccette', teamA: 'Luca', teamB: 'Marta', scoreA: 7, scoreB: 6, target: 10, unit: 'Punti', events: [{ time: 'Ora', text: 'Freccette in corso' }] },
            { id: 'bocce', name: 'Bocce', teamA: 'Marco', teamB: 'Sara', scoreA: 8, scoreB: 7, target: 10, unit: 'Punti', events: [{ time: 'Ora', text: 'Partita di bocce in corso' }] },
            { id: 'bowling', name: 'Bowling', teamA: 'Giorgio', teamB: 'Elena', scoreA: 145, scoreB: 138, target: 150, unit: 'Punti', events: [{ time: 'Ora', text: 'Turno di bowling in corso' }] }
        ],
        events: [
            { time: 'Ora', text: 'Calcetto: partita in corso' },
            { time: '5 min fa', text: 'Freccette: turno in corso' },
            { time: '10 min fa', text: 'Torneo Weekend Cup aggiornato' }
        ]
    },

    init() {
        this.showSection('dashboard');
        this.initLiveMatchFeed();
        this.loadDashboardData();
    },

    showSection(sectionId) {
        const currentUser = this.getCurrentUser();
        const isAdmin = currentUser?.role && currentUser.role !== 'PLAYER';

        if (sectionId === 'admin-section' && !isAdmin) {
            alert('Accesso negato: solo gli amministratori possono accedere a questa sezione.');
            return;
        }

        document.querySelectorAll('.content-section').forEach((section) => {
            section.classList.add('d-none');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }
    },

    async loadAdminData() {
        const services = [
            { name: 'User Service', url: 'http://localhost:3001/health' },
            { name: 'Game Service', url: 'http://localhost:3002/health' },
            { name: 'Match Service', url: 'http://localhost:3003/health' },
            { name: 'Tournament Service', url: 'http://localhost:3004/health' },
            { name: 'Statistics Service', url: 'http://localhost:3005/health' }
        ];

        const body = document.getElementById('admin-services-body');
        if (!body) return;

        body.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Caricamento stato servizi...</td></tr>';

        const results = await Promise.all(services.map(async (service) => {
            try {
                const response = await fetch(service.url, { method: 'GET' });
                const status = response.ok ? 'OK' : `Errore (${response.status})`;
                return { ...service, status };
            } catch (error) {
                return { ...service, status: 'Non raggiungibile' };
            }
        }));

        body.innerHTML = results.map((service) => `
            <tr>
                <td>${service.name}</td>
                <td><span class="badge ${service.status === 'OK' ? 'bg-success' : 'bg-danger'}">${service.status}</span></td>
                <td><code>${service.url}</code></td>
            </tr>
        `).join('');
    },

    async loadDashboardData() {
        const demoData = {
            games: [
                { id: 'game-1', name: 'Calcetto', gameType: 'FOOSBALL', status: 'ONLINE' },
                { id: 'game-2', name: 'Freccette', gameType: 'DARTS', status: 'ONLINE' },
                { id: 'game-3', name: 'Bocce', gameType: 'BOCCE', status: 'ONLINE' },
                { id: 'game-4', name: 'Bowling', gameType: 'BOWLING', status: 'ONLINE' }
            ],
            matches: [
                { id: 1, createdAt: '2026-06-24', result: '3-2', status: 'FINISHED' },
                { id: 2, createdAt: '2026-06-23', result: '2-1', status: 'FINISHED' }
            ],
            tournaments: [
                { id: 1, name: 'Weekend Cup', status: 'ACTIVE' },
                { id: 2, name: 'Challenge Local', status: 'SCHEDULED' }
            ],
            leaderboard: [
                { username: 'Alessandro', score: 1420, rank: 1 },
                { username: 'Marta', score: 1360, rank: 2 },
                { username: 'Luca', score: 1280, rank: 3 }
            ]
        };

        const [gamesRes, matchesRes, tournamentsRes, leaderboardRes] = await Promise.allSettled([
            api.request(CONFIG.GAME_BASE),
            api.request(CONFIG.MATCH_BASE),
            api.request(CONFIG.TOURNAMENT_BASE),
            api.request(CONFIG.STATS_BASE)
        ]);

        const games = gamesRes.status === 'fulfilled' ? gamesRes.value : demoData.games;
        const matches = matchesRes.status === 'fulfilled' ? matchesRes.value : demoData.matches;
        const tournaments = tournamentsRes.status === 'fulfilled' ? tournamentsRes.value : demoData.tournaments;
        const leaderboard = leaderboardRes.status === 'fulfilled' ? leaderboardRes.value : demoData.leaderboard;

        if (gamesRes.status === 'rejected' || matchesRes.status === 'rejected' || tournamentsRes.status === 'rejected' || leaderboardRes.status === 'rejected') {
            console.warn('Uno o più servizi non disponibili: uso dati fallback solo per i servizi non raggiungibili.');
        }

        this.renderDashboard(games, matches, tournaments, leaderboard);
    },

    renderDashboard(games, matches, tournaments, leaderboard) {
        const gamesList = Array.isArray(games) ? games : (games?.games || []);
        const matchesList = Array.isArray(matches) ? matches : (matches?.matches || []);
        const tournamentsList = Array.isArray(tournaments) ? tournaments : (tournaments?.tournaments || []);
        const leaderboardList = Array.isArray(leaderboard) ? leaderboard : (leaderboard?.leaderboard || []);

        this.dashboardState = { games: gamesList, matches: matchesList, tournaments: tournamentsList, leaderboard: leaderboardList };

        const combinedMatches = [...this.recentMatches, ...matchesList]
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, 8);

        document.getElementById('recent-matches-count').textContent = combinedMatches.length;
        document.getElementById('active-tournaments-count').textContent = tournamentsList.length;

        const currentUser = this.getCurrentUser();
        const isAdmin = currentUser?.role === 'PLATFORM_ADMIN';
        let currentRank = null;

        if (leaderboardList.length) {
            leaderboardList.forEach((entry, index) => {
                entry.rank = entry.rank || index + 1;
            });
        }

        if (currentUser && leaderboardList.length) {
            const normalizedUsername = currentUser.username ? currentUser.username.trim().toLowerCase() : '';
            const userEntry = leaderboardList.find((entry) => {
                const entryUsername = entry.username ? entry.username.trim().toLowerCase() : '';
                return (entry.userId && currentUser.id && entry.userId === currentUser.id) || entryUsername === normalizedUsername;
            });
            currentRank = userEntry ? userEntry.rank : null;
        }

        const rankText = currentRank ? `#${currentRank}` : '#--';
        document.getElementById('user-rank').textContent = rankText;
        const rankMessageEl = document.getElementById('user-rank-message');
        if (rankMessageEl) {
            if (!currentUser) {
                rankMessageEl.textContent = 'Accedi per vedere il tuo rank.';
            } else if (currentRank) {
                rankMessageEl.textContent = `Sei classificato al ${rankText}.`;
            } else {
                rankMessageEl.textContent = 'Partecipa a un gioco per entrare in classifica.';
            }
        }

        const gamesGrid = document.getElementById('games-grid');
        if (gamesGrid) {
            gamesGrid.innerHTML = gamesList.length
                ? gamesList.map((game) => `
                    <div class="col">
                        <div class="card h-100 shadow-sm border-0">
                            <div class="card-body">
                                <h5 class="card-title">${game.name || 'Gioco'}</h5>
                                <p class="card-text text-muted">Tipo: ${game.gameType || 'N/D'}</p>
                                <span class="badge ${game.status === 'ONLINE' ? 'bg-success' : 'bg-secondary'}">${game.status || 'N/D'}</span>
                                ${currentUser && currentUser.role === 'PLAYER' && game.status === 'ONLINE'
                                    ? `<div class="mt-3"><button class="btn btn-primary btn-sm" onclick="app.joinGame('${game.id}')">Partecipa al gioco</button></div>`
                                    : ''}
                                ${currentUser && currentUser.role !== 'PLAYER' && game.status === 'ONLINE'
                                    ? '<div class="small text-muted mt-2">Solo i giocatori possono partecipare ai giochi.</div>'
                                    : ''}
                            </div>
                        </div>
                    </div>
                `).join('')
                : '<div class="col"><div class="alert alert-info">Nessun gioco disponibile.</div></div>';
        }

        const matchesListElement = document.getElementById('matches-list');
        if (matchesListElement) {
            matchesListElement.innerHTML = combinedMatches.length
                ? combinedMatches.map((match) => `
                    <tr>
                        <td>${match.createdAt || 'N/D'}</td>
                        <td>${match.gameName || 'Tavolo demo'}</td>
                        <td>${match.result || 'In corso'}</td>
                        <td>${match.status || 'N/D'}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="4" class="text-center">Nessuna partita registrata.</td></tr>';
        }

        const tournamentsGrid = document.getElementById('tournaments-grid');
        if (tournamentsGrid) {
            tournamentsGrid.innerHTML = tournamentsList.length
                ? tournamentsList.map((tournament) => `
                    <div class="col">
                        <div class="card h-100 shadow-sm border-0">
                            <div class="card-body">
                                <h5 class="card-title">${tournament.name || 'Torneo'}</h5>
                                <p class="card-text text-muted">Stato: ${tournament.status || 'N/D'}</p>
                                <p class="card-text small text-muted">Partecipanti: ${(tournament.participants || []).length}/${tournament.maxParticipants || 0}</p>
                                ${currentUser && currentUser.role === 'PLAYER' && tournament.status === 'REGISTRATION_OPEN'
                                    ? `<button class="btn btn-primary btn-sm" onclick="app.joinTournament('${tournament.id}')">Partecipa</button>`
                                    : ''}
                                ${currentUser && currentUser.role !== 'PLAYER' && tournament.status === 'REGISTRATION_OPEN'
                                    ? '<div class="small text-muted mt-2">Solo i giocatori possono iscriversi.</div>'
                                    : ''}
                            </div>
                        </div>
                    </div>
                `).join('')
                : '<div class="col"><div class="alert alert-info">Nessun torneo disponibile.</div></div>';
        }

        const leaderboardContainer = document.getElementById('leaderboard-container');
        if (leaderboardContainer) {
            leaderboardContainer.innerHTML = leaderboardList.length
                ? `
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr><th>#</th><th>Giocatore</th><th>Punti</th></tr>
                        </thead>
                        <tbody>
                            ${leaderboardList.map((entry) => `
                                <tr>
                                    <td>${entry.rank || '-'}</td>
                                    <td>${entry.username || 'N/D'}</td>
                                    <td>${entry.score || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `
                : '<div class="alert alert-info mb-0">Classifica non disponibile.</div>';
        }

        this.renderLiveMatchFeed();
    },

    initLiveMatchFeed() {
        if (this.liveIntervalId) return;

        this.renderLiveMatchFeed();
        this.liveIntervalId = setInterval(() => {
            const game = this.liveState.games[Math.floor(Math.random() * this.liveState.games.length)];
            const isTeamA = Math.random() > 0.5;
            const eventText = isTeamA ? `${game.teamA} segna!` : `${game.teamB} segna!`;

            if (isTeamA) {
                game.scoreA += 1;
            } else {
                game.scoreB += 1;
            }

            game.events.unshift({
                time: 'Adesso',
                text: `${game.name}: ${eventText}`
            });
            game.events = game.events.slice(0, 3);

            this.liveState.events.unshift({
                time: 'Adesso',
                text: `${game.name}: ${eventText}`
            });
            this.liveState.events = this.liveState.events.slice(0, 5);

            if (game.scoreA >= game.target || game.scoreB >= game.target) {
                const winner = game.scoreA >= game.target ? game.teamA : game.teamB;
                const finalResult = `${game.scoreA}-${game.scoreB}`;
                this.recentMatches.unshift({
                    id: Date.now(),
                    createdAt: new Date().toLocaleDateString('it-IT'),
                    gameName: game.name,
                    result: finalResult,
                    status: 'FINISHED'
                });
                this.recentMatches = this.recentMatches.slice(0, 8);
                this.liveState.events.unshift({
                    time: 'Ora',
                    text: `${game.name}: partita finita, ${winner} vince ${finalResult}`
                });
                this.liveState.events.unshift({
                    time: 'Ora',
                    text: `${game.name}: nuova partita iniziata`
                });
                game.scoreA = 0;
                game.scoreB = 0;
                this.renderDashboard(this.dashboardState.games, this.dashboardState.matches, this.dashboardState.tournaments, this.dashboardState.leaderboard);
            }

            this.renderLiveMatchFeed();
        }, 4000);
    },

    renderLiveMatchFeed() {
        const liveGamesGrid = document.getElementById('live-games-grid');
        const landingPreview = document.getElementById('landing-live-results');
        const liveEventsList = document.getElementById('live-events-list');

        if (liveGamesGrid) {
            liveGamesGrid.innerHTML = this.liveState.games.map((game) => `
                <div class="col-md-6">
                    <div class="card border-0 bg-light text-dark h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="fw-bold mb-0">${game.name}</h6>
                                <span class="badge bg-success">Live</span>
                            </div>
                            <div class="row align-items-center text-center">
                                <div class="col">
                                    <div class="fw-semibold">${game.teamA}</div>
                                    <div class="display-6 fw-bold">${game.scoreA}</div>
                                </div>
                                <div class="col-auto">
                                    <div class="text-muted small">${game.unit}</div>
                                </div>
                                <div class="col">
                                    <div class="fw-semibold">${game.teamB}</div>
                                    <div class="display-6 fw-bold">${game.scoreB}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        if (landingPreview) {
            landingPreview.innerHTML = this.liveState.games.map((game) => `
                <div class="col-6">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-3">
                            <div class="small text-muted">${game.name}</div>
                            <div class="fw-bold">${game.scoreA}-${game.scoreB}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        if (liveEventsList) {
            liveEventsList.innerHTML = this.liveState.events.map((event) => `
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-semibold">${event.text}</div>
                        <small class="text-muted">${event.time}</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">Live</span>
                </li>
            `).join('');
        }
    },

    async joinTournament(tournamentId) {
        const currentUser = this.getCurrentUser();

        if (!currentUser) {
            alert("Devi effettuare l'accesso per partecipare a un torneo.");
            return;
        }

        if (currentUser.role !== 'PLAYER') {
            alert('Solo i giocatori possono iscriversi ai tornei.');
            return;
        }

        try {
            await api.request(`${CONFIG.TOURNAMENT_BASE}/${tournamentId}/join`, 'POST', {
                userId: currentUser.id,
                username: currentUser.username
            });

            alert('Iscrizione al torneo completata con successo.');
            await this.loadDashboardData();
        } catch (error) {
            alert(`Iscrizione non riuscita: ${error.message}`);
        }
    },

    async joinGame(gameId) {
        const currentUser = this.getCurrentUser();

        if (!currentUser) {
            alert("Devi effettuare l'accesso per partecipare a un gioco.");
            return;
        }

        if (currentUser.role !== 'PLAYER') {
            alert('Solo i giocatori possono partecipare ai giochi.');
            return;
        }

        try {
            await api.request(CONFIG.MATCH_BASE, 'POST', {
                gameId,
                players: [
                    {
                        userId: currentUser.id,
                        username: currentUser.username,
                        team: 'A'
                    }
                ]
            });

            alert('Sei stato registrato al gioco e la partita è stata avviata.');
            await this.loadDashboardData();
        } catch (error) {
            alert(`Iscrizione al gioco non riuscita: ${error.message}`);
        }
    }
};
