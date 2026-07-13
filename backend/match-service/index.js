require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database');
const fetch = require('node-fetch');
const matchRoutes = require('./matchRoutes');
const Match = require('./Match');
const mqttClient = require('./mqttClient');

const app = express();

app.use(express.json());
app.use(cors());

// Database Connection
sequelize.sync()
  .then(() => console.log('Match Service: Connesso a PostgreSQL e tabelle sincronizzate'))
  .catch(err => console.error('Errore connessione PostgreSQL:', err));

// MQTT Message Handling
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const topicParts = topic.split('/');
    const gameId = topicParts[1];
    const eventType = topicParts[2];

    // Sequelize findOne richiede l'oggetto 'where'
    let match = await Match.findOne({ where: { gameId: gameId, status: 'ONGOING' } });

    if (eventType === 'goal' && match) {
      const teamKey = `team${data.team}`;
      
      // Aggiornamento campo JSONB in Sequelize
      const newScore = { ...match.score };
      newScore[teamKey]++;
      match.score = newScore;
      
      const newEvents = [...match.events, { type: 'GOAL', payload: { team: data.team }, timestamp: new Date() }];
      match.events = newEvents;
      
      await match.save();
      
      console.log(`Goal! ${gameId} - Score: A:${match.score.teamA} B:${match.score.teamB}`);
      
      // In Sequelize l'id è 'id', non '_id'
      mqttClient.publish(`matches/${match.id}/live`, JSON.stringify({
        type: 'SCORE_UPDATE',
        score: match.score
      }));
    }
    
    if (eventType === 'end' && match) {
      match.status = 'FINISHED';
      match.endTime = new Date();
      await match.save();

      // Notifica lo Statistics Service
      const statsUrl = `${process.env.API_GATEWAY_INTERNAL}/api/stats/update`;
      await fetch(statsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: match.players,
          score: match.score
        })
      }).catch(err => console.error("Errore aggiornamento statistiche:", err.message));
    }
  } catch (err) {
    console.error("Errore MQTT:", err);
  }
});

app.use('/api/matches', matchRoutes);

app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Match Service in esecuzione sulla porta ${PORT}`);
});