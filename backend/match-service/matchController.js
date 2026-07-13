const Match = require('./Match');
const mqttClient = require('./mqttClient'); // Importa il client MQTT

exports.createMatch = async (req, res) => {
  try {
    const { gameId, players } = req.body;
    const match = await Match.create({ gameId, players, status: 'ONGOING', startTime: new Date() });

    // Pubblica un evento MQTT per notificare l'inizio della partita
    // Nota: in Sequelize l'id è 'id', non '_id'
    mqttClient.publish(`matches/${match.id}/live`, JSON.stringify({ 
      type: 'MATCH_STARTED', 
      matchId: match.id, 
      gameId: match.gameId, 
      players: match.players,
      score: match.score
    }));

    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ error: "Errore nell'avvio della partita", details: err.message });
  }
};

exports.getMatches = async (req, res) => {
  try {
    // Con Sequelize non c'è populate (si usano le join/associations se necessario)
    // Per ora recuperiamo i dati grezzi dato che i player sono in un campo JSONB
    const matches = await Match.findAll({ order: [['startTime', 'DESC']] });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero delle partite", details: err.message });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: "Partita non trovata" });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero della partita", details: err.message });
  }
};

exports.addEventToMatch = async (req, res) => {
  try {
    const { matchId, eventType, payload } = req.body;
    const match = await Match.findByPk(matchId);
    if (!match) return res.status(404).json({ error: "Partita non trovata" });

    // In Sequelize, con i campi JSONB, dobbiamo riassegnare l'array per attivare il tracking dei cambiamenti
    const events = [...match.events, { type: eventType, payload, timestamp: new Date() }];
    match.events = events;
    await match.save();

    res.json(match);
  } catch (err) {
    res.status(400).json({ error: "Errore nella registrazione evento", details: err.message });
  }
};

exports.endMatch = async (req, res) => {
  try {
    const { matchId } = req.body;
    const match = await Match.findByPk(matchId);
    if (!match) return res.status(404).json({ error: "Partita non trovata" });

    match.status = 'FINISHED';
    match.endTime = new Date();
    await match.save();

    res.json(match);
  } catch (err) {
    res.status(400).json({ error: "Errore nella terminazione partita", details: err.message });
  }
};