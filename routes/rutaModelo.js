const express = require('express');
const multer = require('multer');
const path = require('path');

const { 
  crearModelo, 
  getModelos, 
  actualizarModelo, 
  eliminarModelo 
} = require("../controladores/modeloControlador");

const { protegerRuta } = require('../middlewares/authMiddleware');

const router = express.Router();

// 📂 Configuración de multer (sube archivos a /publico/uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../publico/uploads"));
  },
  filename: (req, file, cb) => {
    // nombre único: timestamp-original.ext
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Rutas
router.post('/', upload.single("imagen"), crearModelo);   // 👈 acepta archivo
router.get('/', getModelos);
router.put('/:id', upload.single("imagen"), actualizarModelo); // 👈 acepta archivo si se cambia
router.delete('/:id', eliminarModelo);

module.exports = router;

//router.post('/api/modelos', crearModelo);
//router.get('/api/modelos', getModelos);

//router.post('/api/modelos', protegerRuta, crearModelo,actualizarModelo);

//router.post('/', crearModelo);
//router.get('/', getModelos);
//router.put('/:id', actualizarModelo);