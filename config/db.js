// pagina/config/db.js
require('dotenv').config();
const mongoose = require('mongoose');

const conectarBD = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ Conectado a MongoDB');
  } catch (err) {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = conectarBD;
