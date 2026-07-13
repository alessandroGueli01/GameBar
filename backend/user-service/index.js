const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database');
const userRoutes = require('./userRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);

// Database Connection
sequelize.sync({ alter: true })
  .then(() => console.log('User Service: Connesso a PostgreSQL'))
  .catch(err => console.error('Errore connessione PostgreSQL:', err));

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`User Service in esecuzione sulla porta ${PORT}`);
});