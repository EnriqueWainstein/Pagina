const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/authMiddleware');
const { enviarPdf } = require('../controladores/wsp');

router.post('/', protegerRuta, enviarPdf);


module.exports = router;