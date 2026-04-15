const express = require('express');
const router = express.Router();
const { getAll, getByUid, cancel, reschedule } = require('../controllers/bookingController');

router.get('/', getAll);
router.get('/:uid', getByUid);
router.patch('/:uid/cancel', cancel);
router.patch('/:uid/reschedule', reschedule);

module.exports = router;
