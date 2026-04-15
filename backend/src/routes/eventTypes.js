const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, toggle } = require('../controllers/eventTypeController');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.patch('/:id/toggle', toggle);

module.exports = router;
