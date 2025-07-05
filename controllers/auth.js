const bcrypt = require('bcryptjs');

const Usuario = require('../models/usuario');
const { generarJWT } = require("../helpers/jwt");

exports.crearUsuario = async (req, res, next) => {

    //Poner el nombre todo en minúsculas
    if (req.body.nombre) {
        req.body.nombre = req.body.nombre.toLowerCase();
    }

    const { nombre, password } = req.body;

    try {

        const existeNombre = await Usuario.findOne({ nombre });
        if (existeNombre) {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario ya está registrado'
            });
        }

        const usuario = new Usuario(req.body);

        //Generar salt y hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);

        await usuario.save();

        //Generar mi Json Web Token
        const token = await generarJWT(usuario.id);

        const { password: _, __v, ...usuarioResp } = usuario.toObject();
        res.json({
            ok: true,
            usuario: usuarioResp,
            token
        });

        console.log('Usuario registrado: ' + usuario.nombre);


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }

}

exports.login = async (req, res, next) => {

    const { nombre, password } = req.body;

    try {

        const usuarioDB = await Usuario.findOne({ nombre });
        if (!usuarioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'Nombre o contraseña incorrectos'
            });
        }

        //Validar el password
        const validPassword = bcrypt.compareSync(password, usuarioDB.password);
        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Nombre o contraseña incorrectos'
            });
        }

        //Generar el Jason Web Token 
        const token = await generarJWT(usuarioDB.id);

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token
        });
        console.log('Usuario conectado: ' + usuarioDB.nombre);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        })
    }
}

exports.renewToken = async (req, res, next) => {
    try {
        //const uid uid del usuario

        const uid = req.uid;

        // 1) Asegurarnos de que el usuario sigue en la base de datos
        const usuario = await Usuario.findById(uid);
        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Token no válido — el usuario no existe'
            });
        }

        //Generar un nuevo json web token 

        const token = await generarJWT(uid);

        res.json({
            ok: true,
            usuario,
            token
        });

        console.log('Renovado token para usuario: ' + usuario.nombre);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error del servidor'
        });
    }}

exports.fcmToken = async (req, res, next) => {
    const userId = req.uid;
    const { 'fcm-token': fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ msg: 'Firebase Cloud Messaging token requerido' });

    await Usuario.findByIdAndUpdate(
        userId,
        {fcmToken: fcmToken},
        {new: true}
    );

    res.json({ok: true});
}

