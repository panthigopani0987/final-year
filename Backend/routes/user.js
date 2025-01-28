const express = require('express');
const { bookAppointment, cancelAppointment, listAppointment } = require('../controllers/UserController');
const router = express.Router();

router.post('/book-appointment',bookAppointment);
router.post('/cancel-appointment/:id',cancelAppointment);
router.get('/list-appointment',listAppointment);

module.exports = router;  