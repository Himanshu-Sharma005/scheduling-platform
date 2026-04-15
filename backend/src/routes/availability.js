const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, addOverride, removeOverride } = require('../controllers/availabilityController');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/overrides', addOverride);
router.delete('/overrides/:id', removeOverride);

module.exports = router;
