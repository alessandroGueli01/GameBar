require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database');
const statisticsRoutes = require('./statisticsRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/stats', statisticsRoutes);

// Database Connection
sequelize.sync()
  .then(() => console.log('Statistics Service: Connesso a PostgreSQL'))
  .catch(err => console.error('Errore connessione PostgreSQL:', err));

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Statistics Service in esecuzione sulla porta ${PORT}`);
});