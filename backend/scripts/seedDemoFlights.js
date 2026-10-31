require('dotenv').config();
const mongoose = require('mongoose');
const Flight = require('../src/models/flight.models');

const demoFlights = [
  { flightNumber: 'DEMO101', airline: 'Altitude Demo Air', departureAirport: 'DEL', arrivalAirport: 'BOM', daysFromNow: 1, departureHour: 8, durationHours: 2 },
  { flightNumber: 'DEMO202', airline: 'Altitude Demo Air', departureAirport: 'BLR', arrivalAirport: 'HYD', daysFromNow: 1, departureHour: 11, durationHours: 1 },
  { flightNumber: 'DEMO303', airline: 'Altitude Demo Air', departureAirport: 'BOM', arrivalAirport: 'GOI', daysFromNow: 2, departureHour: 9, durationHours: 1 },
  { flightNumber: 'DEMO404', airline: 'Altitude Demo Air', departureAirport: 'MAA', arrivalAirport: 'DEL', daysFromNow: 2, departureHour: 15, durationHours: 3 },
  { flightNumber: 'DEMO505', airline: 'Altitude Demo Air', departureAirport: 'HYD', arrivalAirport: 'BLR', daysFromNow: 3, departureHour: 13, durationHours: 1 },
];

const seedDemoFlights = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL is not configured in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URL);
  const existingCount = await Flight.countDocuments();

  if (existingCount > 0) {
    console.log(`Skipped demo seed: the database already contains ${existingCount} flight(s).`);
    return;
  }

  const now = new Date();
  const flights = demoFlights.map(({ daysFromNow, departureHour, durationHours, ...flight }) => {
    const departureTime = new Date(now);
    departureTime.setDate(departureTime.getDate() + daysFromNow);
    departureTime.setHours(departureHour, 0, 0, 0);

    return {
      ...flight,
      status: 'Scheduled',
      totalSeats: 180,
      departureTime,
      arrivalTime: new Date(departureTime.getTime() + durationHours * 60 * 60 * 1000),
    };
  });

  const inserted = await Flight.insertMany(flights);
  console.log(`Added ${inserted.length} clearly labeled demo flights.`);
};

seedDemoFlights()
  .catch((error) => {
    console.error('Could not seed demo flights:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
