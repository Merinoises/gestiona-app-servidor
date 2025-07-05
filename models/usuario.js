// models/usuario.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TurnoSchema = new Schema({
    poolId: {
        type: Schema.Types.ObjectId,
        ref: 'Pool',
        required: true
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    }
});

const UsuarioSchema = new Schema({
    nombre: { type: String, required: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    fcmToken: {type: String, default: null},
    turnos: {
        type: [TurnoSchema],
        default: []
    }
}, {
    timestamps: true
});

module.exports = model('Usuario', UsuarioSchema);
