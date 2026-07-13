require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database');
const tournamentRoutes = require('./tournamentRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/tournaments', tournamentRoutes);

// Database Connection
sequelize.sync()
  .then(() => console.log('Tournament Service: Connesso a PostgreSQL'))
  .catch(err => console.error('Errore connessione PostgreSQL:', err));

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Tournament Service in esecuzione sulla porta ${PORT}`);
});