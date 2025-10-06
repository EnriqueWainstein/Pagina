// pagina/Modelo/venta.js
const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema(
  {
    idUsuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario', // referencia al modelo de usuario
      required: true,
    },
    modelos: [
      {
        Modelo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Modelo', // referencia al modelo de producto
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
          min: [1, 'La cantidad mínima es 1'],
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: [0, 'El total no puede ser negativo'],
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venta', ventaSchema);
