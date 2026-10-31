const express = require('express');
const cors = require('cors');

const flightRoutes = require('./routes/flight.routes');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes=require('./routes/auth.routes')
const app = express();

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS
    || (process.env.NODE_ENV === 'production'
      ? ''
      : 'http://localhost:5173,http://127.0.0.1:5173'))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

if (process.env.NODE_ENV === 'production' && allowedOrigins.size === 0) {
  console.warn('CORS_ORIGINS is not configured; browser requests will be blocked in production.');
}

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.has(origin));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.json({ message: 'Flight Booking API is running' });
});


app.use('/api/flights', flightRoutes);
app.use('/api/auth',authRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;