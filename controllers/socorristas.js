
const Usuario = require('../models/usuario');

exports.getSocorristas = async (req, res, next) => {

    try {
        const socorristas = await Usuario.find({ isAdmin: false });

        return res.status(200).json(socorristas);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'No fue posible cargar los usuarios'
        });
    }

};

exports.asignarTurno = async (req, res, next) => {
  try {
    // 1) Obtener el ID del socorrista de los params
    const socorristaId = req.params.id;

    // 2) El turno viene en el body (con propiedades poolId, start y end)
    const { poolId, start, end } = req.body;

    // 3) Validamos que vengan los campos mínimos
    if (!poolId || !start || !end) {
      return res.status(400).json({
        ok: false,
        msg: 'Debe enviar poolId, start y end en el cuerpo de la petición'
      });
    }

    // 4) Buscamos al socorrista por su ID
    const socorrista = await Usuario.findById(socorristaId);
    if (!socorrista) {
      return res.status(404).json({
        ok: false,
        msg: `No existe un socorrista con ID ${socorristaId}`
      });
    }

    // 5) Construimos el objeto turno (coincide con TurnoSchema)
    const nuevoTurno = {
      poolId,
      start: new Date(start),
      end: new Date(end)
    };

    // 6) Lo insertamos en el array `turnos` del usuario
    socorrista.turnos.push(nuevoTurno);

    // 7) Guardamos los cambios en la base de datos
    const socorristaActualizado = await socorrista.save();

    const usuarioAdmin = await Usuario.findById(req.uid);
    console.log('Turno creado por ' + usuarioAdmin.nombre + 'para socorrista ' + socorristaActualizado.nombre + '(Piscina: ' + poolId + ')');


    // 8) Devolvemos al cliente el socorrista con el turno ya agregado
    return res.status(200).json(socorristaActualizado);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno al asignar turno'
    });
  }
};

// DELETE /socorristas/:id/turnos/:turnoId
exports.borrarTurno = async (req, res, next) => {
  try {
    const socorristaId = req.params.id;
    const turnoId      = req.params.turnoId;
    console.log('Id Socorrista: ' + socorristaId + '; turnoId: '+ turnoId);

    // 1) Verificar que exista el socorrista
    const socorrista = await Usuario.findById(socorristaId);
    if (!socorrista) {
      return res.status(404).json({
        ok: false,
        msg: `No existe un socorrista con ID ${socorristaId}`
      });
    }

    // 2) Usamos $pull para eliminar el subdocumento cuyo _id sea turnoId
    const socorristaActualizado = await Usuario.findByIdAndUpdate(
      socorristaId,
      {
        $pull: { turnos: { _id: turnoId } }
      },
      { new: true } // devuelve el documento actualizado
    );

    return res.status(200).json(socorristaActualizado);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno al borrar el turno'
    });
  }
};

// PUT /api/socorristas/:id/turnos/:turnoId
exports.actualizarTurno = async (req, res, next) => {
  try {
    const socorristaId = req.params.id;
    const turnoId      = req.params.turnoId;
    const { poolId, start, end } = req.body;

    // 1) Validaciones mínimas
    if (!poolId || !start || !end) {
      return res.status(400).json({
        ok: false,
        msg: 'Debe enviar poolId, start y end en el cuerpo de la petición'
      });
    }

    // 2) Nos aseguramos de que el socorrista existe
    const socorrista = await Usuario.findById(socorristaId);
    if (!socorrista) {
      return res.status(404).json({
        ok: false,
        msg: `No existe un socorrista con ID ${socorristaId}`
      });
    }

    // 3) Actualizamos el subdocumento con operador posicional "$"
    const socorristaActualizado = await Usuario.findOneAndUpdate(
      { _id: socorristaId, 'turnos._id': turnoId },
      {
        $set: {
          'turnos.$.poolId': poolId,
          'turnos.$.start': new Date(start),
          'turnos.$.end': new Date(end)
        }
      },
      { new: true } // devuelve el documento actualizado
    );

    if (!socorristaActualizado) {
      // Si no se encontró el turno anidado con ese turnoId
      return res.status(404).json({
        ok: false,
        msg: `No se encontró un turno con ID ${turnoId} para ese socorrista`
      });
    }

    // 4) Devolvemos el objeto actualizado
    return res.status(200).json(socorristaActualizado);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno al actualizar el turno'
    });
  }
};