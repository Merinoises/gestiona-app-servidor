const path = require('path');

const express = require('express');

const authController = require('../controllers/auth');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = express.Router();

router.post('/login', authController.login);

router.post('/crear-usuario', authController.crearUsuario);

router.get('/login/renew', validarJWT, authController.renewToken)

exports.routes = router;