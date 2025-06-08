// models/pool.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

/**
 * Subdocumento que refleja un rango de horas (TimeRange).
 * Ejemplo: 08:00 – 20:00 se guarda como startHour:8, startMinute:0, endHour:20, endMinute:0.
 */
const TimeRangeSchema = new Schema({
  startHour:   { type: Number, required: true },  // 0–23
  startMinute: { type: Number, required: true },  // 0–59
  endHour:     { type: Number, required: true },
  endMinute:   { type: Number, required: true }
}, { _id: false }); // _id:false para no generar un ObjectId por cada TimeRange

/**
 * Subdocumento para horarios semanales.  
 * - weekdays: array de números 1..7 (1 = lunes, …, 7 = domingo)
 * - timeRange: TimeRangeSchema con la hora de inicio y fin
 */
const WeeklyScheduleSchema = new Schema({
  weekdays: {
    type: [Number],
    enum: [1,2,3,4,5,6,7],     // Aseguramos que solo acepte 1..7
    required: true
  },
  timeRange: {
    type: TimeRangeSchema,
    required: true
  }
}, { _id: false });

/**
 * Subdocumento para excepciones puntuales (SpecialSchedule).  
 * - date: fecha exacta (ej. “2025-12-25T00:00:00.000Z”)
 * - timeRange: TimeRangeSchema que indica el horario ese día concreto.
 */
const SpecialScheduleSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  timeRange: {
    type: TimeRangeSchema,
    required: true
  }
}, { _id: false });

/**
 * Schema principal de Pool:
 * - nombre: String obligatorio
 * - ubicacion: String obligatorio
 * - weeklySchedules: [ WeeklyScheduleSchema, … ]
 * - specialSchedules: [ SpecialScheduleSchema, … ]
 */
const PoolSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  ubicacion: {
    type: String,
    required: true,
    trim: true
  },
  fechaApertura: {
    type: Date,
    required: true
  },
  weeklySchedules: {
    type: [WeeklyScheduleSchema],
    default: []  // puede estar vacío si no hay horario fijo semanal
  },
  specialSchedules: {
    type: [SpecialScheduleSchema],
    default: []  // puede estar vacío si no hay excepciones puntuales
  }
}, {
  timestamps: true  // mongoose crea createdAt, updatedAt automáticamente
});

// Índices recomendados (opcional):
// - Si sueles buscar piscinas por nombre o ubicación, puedes indexar esos campos:
// PoolSchema.index({ nombre: 1 });
// PoolSchema.index({ ubicacion: 1 });

module.exports = model('Pool', PoolSchema);
