const Flight = require('../models/flight.models');

// Real world flight data fetch from AviationStack API and save to DB

const  redisClient=require('../config/redis')
const FLIGHT_FIELDS = [
  'flightNumber',
  'airline',
  'departureAirport',
  'arrivalAirport',
  'departureTime',
  'arrivalTime',
  'status',
  'totalSeats',
];

const invalidateFlightCache = async () => {
  try {
    await redisClient.del('allFlights');
  } catch (error) {
    console.warn('Redis cache unavailable; flight changes will expire from cache when Redis reconnects:', error.message);
  }
};

const fetchAndSaveFlights = async () => { 
  try { 
    const apiKey = process.env.AVIATION_API_KEY;
    if (!apiKey) {
      throw new Error('AVIATION_API_KEY is not configured');
    }
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&limit=20`; 
 
    const response = await fetch(url); 
    if (!response.ok) {
      throw new Error(`AviationStack request failed with status ${response.status}`);
    }
    const data = await response.json(); 
    if (data.error) {
      throw new Error(data.error.message || 'AviationStack returned an error');
    }
    const flights = data.data || []; 
 
    const savedFlights = []; 
 
    for (const f of flights) { 
      if (!f.flight || !f.flight.iata) continue; 


      const flightData = { 
        flightNumber: f.flight.iata, 
        airline: f.airline?.name || 'Unknown', 
        departureAirport: f.departure?.airport || 'Unknown', 
        arrivalAirport: f.arrival?.airport || 'Unknown', 
        departureTime: f.departure?.scheduled || new Date(),//use beacause when api couldnot provide data 
        // then it will save current time as default value

        arrivalTime: f.arrival?.scheduled || new Date(), 
        status: f.flight_status || 'scheduled', 
      }; 
 
       
      const saved = await Flight.findOneAndUpdate( 
        { flightNumber: flightData.flightNumber }, 
        flightData, 
        { upsert: true, new: true } 
      ); 
 
      savedFlights.push(saved); 
    } 
    await invalidateFlightCache();
    return savedFlights; 
  } catch (error) { 
    console.error('Error in fetching flights:', error.message); 
    throw error; 
  } 
}; 
 
const getAllFlights = async () => {

  console.time("GET_ALL_FLIGHTS");

  let cacheData;
  try {
    cacheData = await redisClient.get("allFlights");
  } catch (error) {
    console.warn('Redis cache unavailable; loading flights from MongoDB:', error.message);
  }

  if (cacheData) {
    console.log("Cache Run");
    console.timeEnd("GET_ALL_FLIGHTS");
    return JSON.parse(cacheData);
  }

  console.log("Cache Miss");

  const flights = await Flight.find().sort({
    departureTime: 1,
  });

  try {
    await redisClient.set(
      "allFlights",
      JSON.stringify(flights),
      "EX",
      60
    );
  } catch (error) {
    console.warn('Could not cache flights in Redis:', error.message);
  }

  console.timeEnd("GET_ALL_FLIGHTS");

  return flights;
};

 
const getFlightById = async (id) => { 
  return await Flight.findById(id); 
}; 
 
const createFlight = async (data) => {

  const input = data || {};
  const flightData = Object.fromEntries(
    FLIGHT_FIELDS.filter((field) => input[field] !== undefined)
      .map((field) => [field, input[field]])
  );
  const flight = await Flight.create(flightData);

  await invalidateFlightCache();

  return flight;
};

const updateFlight = async (id, data) => {
  const input = data || {};
  const updates = Object.fromEntries(
    FLIGHT_FIELDS.filter((field) => input[field] !== undefined)
      .map((field) => [field, input[field]])
  );

  if (Object.keys(updates).length === 0) {
    const error = new Error('Provide at least one valid flight field to update');
    error.status = 400;
    throw error;
  }

  const flight = await Flight.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (flight) {
    await invalidateFlightCache();
  }
  return flight;
};

const deleteFlight = async (id) => {
  const flight = await Flight.findByIdAndDelete(id);
  if (flight) {
    await invalidateFlightCache();
  }
  return flight;
};




module.exports = { 
  fetchAndSaveFlights, 
  getAllFlights, 
  getFlightById, 
  createFlight,
  updateFlight,
  deleteFlight,
  
};

