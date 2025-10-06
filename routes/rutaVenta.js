 const express = require('express');
const { crearVenta, getVentas, eliminarVenta, generarResumenPDF } = require('../controladores/ventaControlador');

const {protegerRuta} = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/',protegerRuta, crearVenta);
router.get('/', getVentas);
router.delete('/:id', protegerRuta, eliminarVenta);
router.get('/resumen/:periodo', protegerRuta, generarResumenPDF);

module.exports = router;

//router.post('/api/ventas', crearVenta);
//router.get('/api/ventas', getVentas);

  
