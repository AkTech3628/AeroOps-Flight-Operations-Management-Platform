const flightService = require('../services/flight.service');

// GET /api/flights - 
const getFlights = async (req, res, next) => {
  try {
    const flights = await flightService.getAllFlights();
    res.json({
      count: flights.length,
      data: flights,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/flights/:id - 
const getFlight = async (req, res, next) => {
  try {
    const flight = await flightService.getFlightById(req.params.id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    res.json(flight);
  } catch (err) {
    next(err);
  }
};

// POST /api/flights - 
const addFlight = async (req, res, next) => {
  try {
    const flight = await flightService.createFlight(req.body);
    res.status(201).json(flight);
  } catch (err) {
    next(err);
  }
};

const updateFlight = async (req, res, next) => {
  try {
    const flight = await flightService.updateFlight(req.params.id, req.body);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    res.json(flight);
  } catch (err) {
    next(err);
  }
};

const deleteFlight = async (req, res, next) => {
  try {
    const flight = await flightService.deleteFlight(req.params.id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    res.json({ message: 'Flight deleted successfully', flight });
  } catch (err) {
    next(err);
  }
};

// POST /api/flights/sync 
const syncFlights = async (req, res, next) => {
  try {
    const flights = await flightService.fetchAndSaveFlights();
    res.json({
      message: 'Flights synced successfully',
      count: flights.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFlights,
  getFlight,
  addFlight,
  updateFlight,
  deleteFlight,
  syncFlights,
};