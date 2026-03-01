



require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RescueBite server is running' });
});


const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
const listingsRoutes = require('./routes/listings');
app.use('/listings', listingsRoutes);
const reservationsRoutes = require('./routes/reservations');  
app.use('/reservations', reservationsRoutes);   
app.use('/notifications', require('./routes/notifications'));  
app.use('/messages',      require('./routes/messages'));   
app.use('/ratings',   require('./routes/ratings'));
app.use('/providers', require('./routes/providers'));
app.use('/receivers', require('./routes/receivers'));
const { startNoShowCron } = require('./cron/noShowTimeout');
startNoShowCron();


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});