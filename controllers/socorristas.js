
const Usuario = require('../models/usuario');
const Pool = require('../models/pool');
const { sendPush } = require('../helpers/notifications');

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
    console.log('Turno creado para socorrista ' + socorristaActualizado.nombre + '(Piscina: ' + poolId + ')');

    let nombrePiscina = 'piscina';
    try {
      const piscina = await Pool.findById(poolId);
      if (piscina) nombrePiscina = piscina.nombre;
    } catch (_) {
      // si falla la búsqueda, seguimos con nombre genérico
    }

    const fechaObj = socorristaActualizado.turnos.slice(-1)[0].start;
    const fechaFinObj = socorristaActualizado.turnos.slice(-1)[0].end;

    // Fecha igual que antes
    const fecha = fechaObj.toLocaleDateString('es-ES', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });

    // Hora en zona Madrid (UTC+2) para que salga “08:00” aunque Date venga en UTC
    const optsHora = {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const horaInicio = fechaObj.toLocaleTimeString('es-ES', optsHora); // "08:00"
    const horaFin = fechaFinObj.toLocaleTimeString('es-ES', optsHora); // "20:00"


    // ─── Envío del push ───
    if (socorristaActualizado.fcmToken) {
      const titulo = '🏊➕ Turno asignado';
      const cuerpo = `Se te ha asignado un turno el ${fecha} de ${horaInicio} a ${horaFin} en ${nombrePiscina}`;
      await sendPush(socorristaActualizado.fcmToken, titulo, cuerpo);
    }


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
    const turnoId = req.params.turnoId;
    console.log('Id Socorrista: ' + socorristaId + '; turnoId: ' + turnoId);

    // 1) Verificar que exista el socorrista
    const socorrista = await Usuario.findById(socorristaId);
    if (!socorrista) {
      return res.status(404).json({
        ok: false,
        msg: `No existe un socorrista con ID ${socorristaId}`
      });
    }

    const turnoObj = socorrista.turnos.id(turnoId);
    if (!turnoObj) {
      return res.status(404).json({
        ok: false,
        msg: `No se encontró un turno con ID ${turnoId}`
      });
    }

    const optsFecha = {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    };
    const optsHora = {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    const start = turnoObj.start;
    const end = turnoObj.end;
    const fecha = start.toLocaleDateString('es-ES', optsFecha);   
    const hi = start.toLocaleTimeString('es-ES', optsHora);     
    const hf = end.toLocaleTimeString('es-ES', optsHora);

    // 4) Recuperar nombre de la piscina
    let nombrePiscina = 'piscina';
    try {
      const piscina = await Pool.findById(turnoObj.poolId);
      if (piscina) nombrePiscina = piscina.nombre;
    } catch (_) { }

    // 2) Usamos $pull para eliminar el subdocumento cuyo _id sea turnoId
    const socorristaActualizado = await Usuario.findByIdAndUpdate(
      socorristaId,
      {
        $pull: { turnos: { _id: turnoId } }
      },
      { new: true } // devuelve el documento actualizado
    );

    if (socorrista.fcmToken) {
      const titulo = 'Turno eliminado ❌';
      const cuerpo = `Se ha eliminado tu turno del ${fecha} de ${hi} a ${hf} en ${nombrePiscina}`;
      await sendPush(socorrista.fcmToken, titulo, cuerpo);
    }


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
    const turnoId = req.params.turnoId;
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

    let nombrePiscina = 'piscina';
    try {
      const piscina = await Pool.findById(poolId);
      if (piscina) nombrePiscina = piscina.nombre;
    } catch (_) { }

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

    const startDate = new Date(start);
    const fecha = startDate.toLocaleDateString('es-ES', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });

    if (socorrista.fcmToken) {
      const titulo = 'Turno modificado 🔄';
      const cuerpo = `Se ha modificado tu turno del ${fecha} en ${nombrePiscina}`;
      await sendPush(socorrista.fcmToken, titulo, cuerpo);
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