const { Op } = require('sequelize');
const Statistic = require('./Statistic');

// Ottieni la classifica globale (Leaderboard)
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await Statistic.findAll({
      where: {
        matchesPlayed: {
          [Op.gt]: 0
        }
      },
      order: [['points', 'DESC'], ['wins', 'DESC']],
      limit: limit
    });
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero della classifica", details: err.message });
  }
};

// Ottieni statistiche di un singolo utente
exports.getUserStats = async (req, res) => {
  try {
    const stats = await Statistic.findOne({ where: { userId: req.params.userId } });
    if (!stats) return res.status(404).json({ error: "Statistiche non trovate per questo utente" });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero statistiche", details: err.message });
  }
};

// Aggiorna statistiche dopo una partita (chiamata interna o via match-service)
exports.processMatchResult = async (req, res) => {
  try {
    const { players, score } = req.body; // players: [{userId, username, team}], score: {teamA, teamB}

    const winnerTeam = score.teamA > score.teamB ? 'A' : (score.teamB > score.teamA ? 'B' : 'DRAW');

    const updatePromises = players.map(async (player) => {
      let result = 'draw';
      let pointsToAdd = 1;

      if (winnerTeam !== 'DRAW') {
        if (player.team === winnerTeam) {
          result = 'win';
          pointsToAdd = 3;
        } else {
          result = 'loss';
          pointsToAdd = 0;
        }
      }

      const [stat, created] = await Statistic.findOrCreate({
        where: { userId: player.userId },
        defaults: {
          username: player.username,
          matchesPlayed: 1,
          wins: result === 'win' ? 1 : 0,
          losses: result === 'loss' ? 1 : 0,
          draws: result === 'draw' ? 1 : 0,
          points: pointsToAdd
        }
      });

      if (!created) {
        stat.username = player.username;
        stat.matchesPlayed += 1;
        if (result === 'win') stat.wins += 1;
        if (result === 'loss') stat.losses += 1;
        if (result === 'draw') stat.draws += 1;
        stat.points += pointsToAdd;
        await stat.save();
      }
      return stat;
    });

    await Promise.all(updatePromises);
    res.json({ message: "Statistiche aggiornate correttamente" });
  } catch (err) {
    res.status(400).json({ error: "Errore nell'aggiornamento statistiche", details: err.message });
  }
};