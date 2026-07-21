require('dotenv').config();
const axios = require('axios');

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3001/api/users';
const GAME_SERVICE = process.env.GAME_SERVICE_URL || 'http://localhost:3002/api/games';
const TOURNAMENT_SERVICE = process.env.TOURNAMENT_SERVICE_URL || 'http://localhost:3004/api/tournaments';

async function runSeed() {
  try {
    console.log('--- Inizio Seeding ---');

    const users = [
      { username: 'Luigi Verdi', email: 'luigiverdi@example.com', password: 'luigi123!', role: 'PLAYER' },
      { username: 'Local Admin', email: 'local@admin.com', password: 'admin123!', role: 'LOCATION_ADMIN' },
      { username: 'Game Admin', email: 'game@admin.com', password: 'admin123!', role: 'GAME_ADMIN' },
      { username: 'Platform Admin', email: 'platform@admin.com', password: 'admin123!', role: 'PLATFORM_ADMIN' }
    ];

    for (const userData of users) {
      await axios.post(`${USER_SERVICE}/register`, userData).catch(() => console.log(`Utente ${userData.username} già presente.`));
    }

    try {
      const locationResponse = await axios.post(`${GAME_SERVICE}/locations`, {
        name: 'Bar Centrale',
        address: 'Piazza Duomo',
        city: 'Milano'
      });

      await axios.post(`${GAME_SERVICE}/`, {
        name: 'Tavolo Pro 1',
        gameType: 'FOOSBALL',
        locationId: locationResponse.data.id,
        status: 'ONLINE'
      });
    } catch (error) {
      console.log('[WARN] Seed giochi saltato (game-service non raggiungibile o dati già presenti).');
    }

    const tournaments = [
      {
        name: 'Weekend Cup',
        description: 'Torneo aperto ai giocatori del weekend',
        gameType: 'FOOSBALL',
        status: 'REGISTRATION_OPEN',
        maxParticipants: 16,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Summer Darts Challenge',
        description: 'Sfida freccette a iscrizione libera',
        gameType: 'DARTS',
        status: 'REGISTRATION_OPEN',
        maxParticipants: 12,
        startDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const tournamentData of tournaments) {
      await axios.post(TOURNAMENT_SERVICE, tournamentData)
        .catch(() => console.log(`Torneo ${tournamentData.name} già presente.`));
    }

    console.log('--- Seeding completato con successo ---');
    console.log('Ricarica il frontend per vedere i dati.');
  } catch (error) {
    console.error('Errore durante il seed:', error.message || error);
    console.log('Assicurati che user-service, game-service e tournament-service siano attivi.');
  }
}

runSeed();