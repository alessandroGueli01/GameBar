const Tournament = require('./Tournament');

// Crea un nuovo torneo
exports.createTournament = async (req, res) => {
  try {
    const tournament = await Tournament.create(req.body);
    res.status(201).json(tournament);
  } catch (err) {
    res.status(400).json({ error: "Errore nella creazione del torneo", details: err.message });
  }
};

// Ottieni tutti i tornei (con filtri opzionali e conteggi partecipanti)
exports.getTournaments = async (req, res) => {
  try {
    const { status, gameType, locationId } = req.query;
    let query = {};
    if (status) query.status = status;
    if (gameType) query.gameType = gameType;
    if (locationId) query.locationId = locationId;

    const tournaments = await Tournament.findAll({ 
      where: query, 
      order: [['startDate', 'DESC']] 
    });

    // Aggiungi il conteggio partecipanti e posti disponibili
    const tournamentsWithCounts = tournaments.map(tournament => {
      const data = tournament.toJSON();
      data.participantCount = tournament.participants.length;
      data.availableSpots = tournament.maxParticipants - tournament.participants.length;
      return data;
    });

    res.json(tournamentsWithCounts);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dei tornei", details: err.message });
  }
};

// Ottieni un torneo per ID (con numero partecipanti)
exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findByPk(req.params.id);
    if (!tournament) return res.status(404).json({ error: "Torneo non trovato" });
    
    // Aggiungi il numero di partecipanti e posti disponibili
    const tournamentData = tournament.toJSON();
    tournamentData.participantCount = tournament.participants.length;
    tournamentData.availableSpots = tournament.maxParticipants - tournament.participants.length;
    
    res.json(tournamentData);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero del torneo", details: err.message });
  }
};

// Aggiorna un torneo
exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByPk(req.params.id);
    if (!tournament) return res.status(404).json({ error: "Torneo non trovato" });
    await tournament.update(req.body);
    res.json(tournament);
  } catch (err) {
    res.status(400).json({ error: "Errore nell'aggiornamento del torneo", details: err.message });
  }
};

// Elimina un torneo
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByPk(req.params.id);
    if (!tournament) return res.status(404).json({ error: "Torneo non trovato" });
    await tournament.destroy();
    res.json({ message: "Torneo eliminato con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore nell'eliminazione del torneo", details: err.message });
  }
};

// Iscrivi un partecipante a un torneo
exports.joinTournament = async (req, res) => {
  try {
    const { userId, username } = req.body; // Assumiamo che userId e username vengano dal frontend/User Service
    const tournament = await Tournament.findByPk(req.params.id);

    if (!tournament) return res.status(404).json({ error: "Torneo non trovato" });
    if (tournament.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ error: "Le iscrizioni per questo torneo sono chiuse." });
    }
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ error: "Il torneo ha raggiunto il numero massimo di partecipanti." });
    }
    if (tournament.participants.some(p => p.userId.toString() === userId)) {
      return res.status(400).json({ error: "L'utente è già iscritto a questo torneo." });
    }

    const participants = [...tournament.participants, { userId, username, score: 0, wins: 0, losses: 0 }];
    tournament.participants = participants;
    await tournament.save();
    res.json(tournament);
  } catch (err) {
    res.status(400).json({ error: "Errore nell'iscrizione al torneo", details: err.message });
  }
};

// Rimuovi un partecipante da un torneo (cancellazione iscrizione)
exports.leaveTournament = async (req, res) => {
  try {
    const { userId } = req.body;
    const tournament = await Tournament.findByPk(req.params.id);

    if (!tournament) return res.status(404).json({ error: "Torneo non trovato" });
    
    // Verifica se il torneo è ancora aperto alle iscrizioni
    if (tournament.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ error: "Non puoi cancellarti da un torneo che non è in fase di iscrizione." });
    }

    // Verifica se l'utente è iscritto
    if (!tournament.participants.some(p => p.userId.toString() === userId)) {
      return res.status(400).json({ error: "L'utente non è iscritto a questo torneo." });
    }

    // Rimuovi l'utente
    const updatedParticipants = tournament.participants.filter(p => p.userId.toString() !== userId);
    tournament.participants = updatedParticipants;
    await tournament.save();

    res.json({
      message: "Iscrizione annullata con successo",
      participantCount: updatedParticipants.length,
      availableSpots: tournament.maxParticipants - updatedParticipants.length
    });
  } catch (err) {
    res.status(400).json({ error: "Errore nella cancellazione dell'iscrizione", details: err.message });
  }
};

// Finalizza un torneo e calcola la classifica
exports.endTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByPk(req.params.id);
    if (!tournament) return res.status(404).json({ error: "Torneo non trovato" });
    if (tournament.status === 'FINISHED') {
      return res.status(400).json({ error: "Il torneo è già terminato." });
    }

    // Logica per calcolare la classifica finale
    // Per ora, ordiniamo i partecipanti per punteggio (assumendo che i punteggi siano stati aggiornati)
    tournament.participants.sort((a, b) => b.score - a.score);
    tournament.leaderboard = tournament.participants.map((p, index) => ({
      userId: p.userId,
      username: p.username,
      finalScore: p.score,
      finalRank: index + 1
    }));

    tournament.status = 'FINISHED';
    tournament.endDate = new Date();
    await tournament.save();
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: "Errore nella finalizzazione del torneo", details: err.message });
  }
};