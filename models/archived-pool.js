// models/archivedPool.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ArchivedTurnoSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  turno: {
    poolId: {
      type: Schema.Types.ObjectId,
      ref: 'Pool',
      required: true
    },
    start: { type: Date, required: true },
    end:   { type: Date, required: true }
  }
}, { _id: false });

const ArchivedPoolSchema = new Schema({
  pool: {
    nombre:       { type: String, required: true },
    ubicacion:    { type: String, required: true },
    fechaApertura:{ type: Date,   required: true },
    weeklySchedules:  { type: Array, default: [] },
    specialSchedules: { type: Array, default: [] }
  },
  deletedAt: { type: Date, default: () => new Date() },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  archivedTurnos: {
    type: [ArchivedTurnoSchema],
    default: []
  }
});

module.exports = model('ArchivedPool', ArchivedPoolSchema);
