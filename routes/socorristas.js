const path = require('path');

const express = require('express');

const socorristasController = require('../controllers/socorristas');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = express.Router();

router.get('/socorristas', socorristasController.getSocorristas);

router.put('/socorrista/establecer-turno/:id', validarJWT, socorristasController.asignarTurno);

router.delete('/socorrista/:id/turnos/:turnoId', validarJWT, socorristasController.borrarTurno);

router.put('/socorrista/:id/turnos/:turnoId', validarJWT, socorristasController.actualizarTurno);


exports.routes = router;