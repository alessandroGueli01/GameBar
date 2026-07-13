const mqtt = require('mqtt');

/**
 * Configurazione
 * È possibile passare l'indirizzo del broker e l'ID del gioco tramite variabili d'ambiente.
 */
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
const GAME_ID = process.env.GAME_ID || '6667a4b1c2d3e4f5a6b7c8d9';

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
    console.log(`[Sensor-Sim] Connesso al broker: ${MQTT_BROKER}`);
    console.log(`[Sensor-Sim] Simulazione avviata per il Gioco ID: ${GAME_ID}`);
    
    runSimulation();
});

/**
 * Simula il ciclo di vita di una partita di calciobalilla.
 */
async function runSimulation() {
    try {
        // 1. Inizio Partita
        console.log(`[Sensor-Sim] Pubblicazione START partita su: games/${GAME_ID}/start`);
        client.publish(`games/${GAME_ID}/start`, JSON.stringify({ 
            timestamp: new Date().toISOString() 
        }));

        // 2. Simulazione Goal
        const goalsToWin = 5;
        let score = { A: 0, B: 0 };

        while (score.A < goalsToWin && score.B < goalsToWin) {
            // Attesa casuale tra un goal e l'altro (da 2 a 5 secondi)
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
            
            const team = Math.random() > 0.5 ? 'A' : 'B';
            score[team]++;
            
            console.log(`[Sensor-Sim] GOAL! Squadra ${team}. Punteggio attuale: A:${score.A} - B:${score.B}`);
            client.publish(`games/${GAME_ID}/goal`, JSON.stringify({ 
                team: team,
                timestamp: new Date().toISOString() 
            }));
        }

        // 3. Fine Partita
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(`[Sensor-Sim] Pubblicazione END partita su: games/${GAME_ID}/end`);
        client.publish(`games/${GAME_ID}/end`, JSON.stringify({ 
            finalScore: score,
            timestamp: new Date().toISOString() 
        }));

    } catch (error) {
        console.error('[Sensor-Sim] Errore durante la simulazione:', error);
    } finally {
        console.log('[Sensor-Sim] Simulazione completata. Disconnessione...');
        client.end();
    }
}

client.on('error', (err) => {
    console.error('[Sensor-Sim] Errore MQTT:', err);
});