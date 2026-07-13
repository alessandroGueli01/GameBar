const User = require('./User');
const jwt = require('jsonwebtoken');

const USER_ROLES = ['PLAYER', 'LOCATION_ADMIN', 'GAME_ADMIN', 'PLATFORM_ADMIN'];

function sanitizeUser(user) {
  const { password, ...userData } = user.toJSON();
  return userData;
}

function determineRoleFromEmail(email) {
  if (!email || !email.includes('@')) {
    return 'PLAYER';
  }

  const [localPart, domainPart] = email.toLowerCase().split('@');
  const domain = domainPart?.trim();
  const local = localPart?.trim();

  if (domain === 'admin.com') {
    return 'PLATFORM_ADMIN';
  }

  if (local?.includes('arbitro') || domain?.includes('gameadmin')) {
    return 'GAME_ADMIN';
  }

  if (local?.includes('locale') || domain?.includes('locationadmin')) {
    return 'LOCATION_ADMIN';
  }

  return 'PLAYER';
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const role = determineRoleFromEmail(email);

    const user = await User.create({ username, email, password, role });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    res.status(400).json({ error: 'Errore durante la registrazione', details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: 'Errore durante il login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero profilo' });
  }
};