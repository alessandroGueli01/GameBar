const mqtt = require('mqtt');
// Connessione al broker MQTT che gira su Docker
const client = mqtt.connect('mqtt://localhost:1883'); 

// ID di un gioco di esempio. Assicurati che questo ID esista nel tuo Game Service.
// DOVRAI SOSTITUIRE QUESTO ID CON UN ID REALE DI UN GIOCO CREATO TRAMITE IL GAME SERVICE
const GAME_ID = "6667a4b1c2d3e4f5a6b7c8d9"; 

console.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatore Calconsole.log(`Simulatoregiconsole.log(`Simulatore Calconsole.log(`Simul   console.log(`r("Errore durante la pubblicazione MQTT:", err);
      } else {
        console.log(`Evento inviato: GOAL per Team ${payload.team} (Game ID: ${GAME_ID})`);
      }
    });
  }, 5000); // Invia un goal ogni 5 secondi
});

client.on('error', (err) => {
  console.error("Errore di connessione MQTT per il simulatore:", err);
});
