const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight.controller');

const auth=require('../middlewares/auth.middleware')
const admin=require('../middlewares/admin.middleware')


router.get('/', auth, flightController.getFlights);
router.post('/sync', auth, admin, flightController.syncFlights);
router.get('/:id', auth, flightController.getFlight);
router.post('/', auth, admin, flightController.addFlight);
router.patch('/:id', auth, admin, flightController.updateFlight);
router.delete('/:id', auth, admin, flightController.deleteFlight);

module.exports = router;
