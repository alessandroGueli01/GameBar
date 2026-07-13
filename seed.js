require('dotenv').config();
const axios = require('axios');

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3001/api/users';
const GAME_SERVICE = process.env.GAME_SERVICE_URL || 'http://localhost:3002/api/games';

async function runSeed() {
  try {
    console.log('--- Inizio Seeding ---');

    const users = [
      { username: 'Alessandro', email: 'alessandro@example.com', password: 'password123', role: 'PLAYER' },
      { username: 'Lucia', email: 'lucia@example.com', password: 'password123', role: 'LOCATION_ADMIN' },
      { username: 'Marco', email: 'marco@example.com', password: 'password123', role: 'GAME_ADMIN' },
      { username: 'Admin', email: 'admin@example.com', password: 'password123', role: 'PLATFORM_ADMIN' }
    ];

    for (const userData of users) {
      await axios.post(`${USER_SERVICE}/register`, userData).catch(() => console.log(`Utente ${userData.username} già presente.`));
    }

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

    console.log('--- Seeding completato con successo ---');
    console.log('Ricarica il frontend per vedere i dati.');
  } catch (error) {
    console.error('Errore durante il seed:', error.message);
    console.log('Assicurati che user-service e game-service siano attivi.');
  }
}

runSeed();