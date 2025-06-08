const path = require('path');

const express = require('express');

const poolController = require('../controllers/pool');

const router = express.Router();

router.post('/pools', poolController.crearPiscina);

router.get('/pools', poolController.getAllPools);

router.delete('/pools/:id', poolController.deletePool);

router.put('/pools/:id', poolController.updatePool);

exports.routes = router;