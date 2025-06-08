const path = require('path');

const express = require('express');

const socorristasController = require('../controllers/socorristas');

const router = express.Router();

router.get('/socorristas', socorristasController.getSocorristas);

router.put('/socorrista/establecer-turno/:id', socorristasController.asignarTurno);

router.delete('/socorrista/:id/turnos/:turnoId', socorristasController.borrarTurno);

router.put('/socorrista/:id/turnos/:turnoId', socorristasController.actualizarTurno);


exports.routes = router;