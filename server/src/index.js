

//loads env file

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// creates server application
const app = express();

// allows the React app (on port 5173) to call this server (on port 3001)
app.use(cors());

// lets the server read JSON data from incoming requests
app.use(express.json());

// Health check —  http://localhost:3001/health 
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RescueBite server is running' });
});

// Auth routes — register and login
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Listings routes — post food, browse food, reserve, confirm
const listingsRoutes = require('./routes/listings');
app.use('/listings', listingsRoutes);

// Reservations history 
const reservationsRoutes = require('./routes/reservations');  // ← new
app.use('/reservations', reservationsRoutes);   

app.use('/notifications', require('./routes/notifications'));  
app.use('/messages',      require('./routes/messages'));   

app.use('/ratings',   require('./routes/ratings'));
app.use('/providers', require('./routes/providers'));
app.use('/receivers', require('./routes/receivers'));


const { startNoShowCron } = require('./cron/noShowTimeout');
startNoShowCron();

// Start the server on the port from .env (3001)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});