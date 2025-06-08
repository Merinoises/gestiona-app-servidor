const Pool = require('../models/pool');
const Usuario      = require('../models/usuario');
const ArchivedPool = require('../models/archived-pool');

exports.crearPiscina = async (req, res, next) => {

    try {
        console.log(req.body);

        const pool = new Pool(req.body);

        console.log(pool);



        const savedPool = await pool.save();

        res.status(201).json({
            ok: true,
            pool: savedPool
        });

        console.log('Piscina registrada: ' + savedPool._id);


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }

}

exports.getAllPools = async (req, res, next) => {
  try {
    // 1) Obtenemos todas las piscinas de la colección
    const pools = await Pool.find();

    // 2) Respondemos con un array JSON de piscinas (status 200)
    return res.status(200).json(pools);
  } catch (error) {
    console.error('Error al obtener todas las piscinas:', error);
    return res.status(500).json({
      msg: 'Error en el servidor al obtener piscinas'
    });
  }
};


exports.deletePool = async (req, res, next) => {
  try {
    const poolId    = req.params.id;
    const deletedBy = req.userId; // si lo tienes por middleware auth

    // 1) Buscar la piscina
    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ ok: false, msg: 'Pool no encontrado' });
    }

    // 2) Encontrar todos los usuarios con turnos de esta piscina
    const usuarios = await Usuario.find({ 'turnos.poolId': poolId });

    // 3) Construir el array de turnos a archivar
    const archivedTurnos = [];
    usuarios.forEach(u => {
      u.turnos.forEach(t => {
        if (t.poolId.toString() === poolId) {
          archivedTurnos.push({
            usuarioId: u._id,
            turno: {
              poolId: t.poolId,
              start:   t.start,
              end:     t.end
            }
          });
        }
      });
    });

    // 4) Crear documento ArchivedPool
    await ArchivedPool.create({
      pool: {
        nombre:          pool.nombre,
        ubicacion:       pool.ubicacion,
        fechaApertura:   pool.fechaApertura,
        weeklySchedules: pool.weeklySchedules,
        specialSchedules:pool.specialSchedules
      },
      deletedBy,
      archivedTurnos
    });

    // 5) Eliminar esos turnos de los usuarios
    await Usuario.updateMany(
      { 'turnos.poolId': poolId },
      { $pull: { turnos: { poolId } } }
    );

    // 6) Borrar la piscina activa
    await Pool.findByIdAndDelete(poolId);

    return res.status(200).json({
      ok: true,
      msg: `Piscina eliminada y ${archivedTurnos.length} turnos archivados`
    });
  } catch (error) {
    console.error('Error al eliminar pool:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno al eliminar piscina'
    });
  }
};

/**
 * PUT /pools/:id
 * Actualiza una piscina existente con los datos que vienen en el body.
 */
exports.updatePool = async (req, res, next) => {
  try {
    const poolId = req.params.id;
    const {
      nombre,
      ubicacion,
      fechaApertura,
      weeklySchedules,
      specialSchedules
    } = req.body;

    // 1) Validaciones mínimas
    if (!nombre || !ubicacion || !fechaApertura) {
      return res.status(400).json({
        ok: false,
        msg: 'Debe enviar nombre, ubicación y fechaApertura'
      });
    }

    // 2) Buscar y actualizar la piscina
    const actualizado = await Pool.findByIdAndUpdate(
      poolId,
      {
        nombre,
        ubicacion,
        fechaApertura: new Date(fechaApertura),
        // Si no vienen schedules, mantenemos los que ya hubiera:
        ...(weeklySchedules   !== undefined && { weeklySchedules   }),
        ...(specialSchedules  !== undefined && { specialSchedules  })
      },
      {
        new: true,            // devuelve el doc actualizado
        runValidators: true   // aplica las validaciones de Schema
      }
    );

    // 3) Si no existe, devolvemos 404
    if (!actualizado) {
      return res.status(404).json({
        ok: false,
        msg: `No existe una piscina con ID ${poolId}`
      });
    }

    // 4) Respondemos con el objeto actualizado
    return res.status(200).json(actualizado);

  } catch (error) {
    console.error('Error al actualizar pool:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno al actualizar la piscina'
    });
  }
};
