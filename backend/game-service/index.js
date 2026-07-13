require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database');
const gameRoutes = require('./gameRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/games', gameRoutes);

// Database Connection
sequelize.sync()
  .then(() => console.log('Game Service: Connesso a PostgreSQL'))
  .catch(err => console.error('Errore connessione PostgreSQL:', err));

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Game Service in esecuzione sulla porta ${PORT}`);
});