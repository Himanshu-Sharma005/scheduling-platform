const express = require('express');
const router = express.Router();
const { getUserProfile, getEventInfo, getSlots, createBooking } = require('../controllers/publicBookingController');

router.get('/:username', getUserProfile);
router.get('/:username/:slug', getEventInfo);
router.get('/:username/:slug/slots', getSlots);
router.post('/:username/:slug/book', createBooking);

module.exports = router;
