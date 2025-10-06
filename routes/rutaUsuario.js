const express = require('express');
const {getPerfil, actualizarPerfil, registroUsuario, getUsuarios,actualizarUsuario, eliminarUsuario } = require('../controladores/usuarioControlador');

const {protegerRuta, autorizarRoles} = require('../middlewares/authMiddleware');
const router = express.Router();

router.get("/me", protegerRuta, getPerfil);
router.put("/me", protegerRuta, actualizarPerfil);

router.get('/',protegerRuta, getUsuarios);
router.post('/', registroUsuario);

router.put('/:id', actualizarUsuario); 
router.delete('/:id', eliminarUsuario);



module.exports = router;