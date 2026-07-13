const Game = require('./Game');
const Location = require('./Location');

// Location Controllers
exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Game Controllers
exports.createGame = async (req, res) => {
  try {
    const game = await Game.create(req.body);
    res.status(201).json(game);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getGames = async (req, res) => {
  try {
    const { locationId, status } = req.query;
    let query = {};
    if (locationId) query.locationId = locationId;
    if (status) query.status = status;

    const games = await Game.findAll({ 
      where: query,
      include: [{ model: Location, as: 'location', attributes: ['name'] }]
    });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id, {
      include: [{ model: Location, as: 'location' }]
    });
    if (!game) return res.status(404).json({ error: 'Gioco non trovato' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGameStatus = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ error: 'Gioco non trovato' });
    game.status = req.body.status;
    await game.save();
    res.json(game);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};