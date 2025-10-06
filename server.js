require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');
const { protegerRuta, authorizeRoles } = require('./middlewares/authMiddleware');
const proxyCache = require("./middlewares/prxyCacheMiddleware");
const usuarioRutas = require('./routes/rutaUsuario');
const ModeloRutas = require('./routes/rutaModelo');
const rutaLogIn = require('./routes/rutaLogIn');
const VentaRutas = require('./routes/rutaVenta');
const wspRutas = require('./routes/rutaWsp');
const conectarBD = require('./config/db');
conectarBD();






app.use(cookieParser());
app.use(
  cors({
    origin: 'https://le-garage-chic.onrender.com',
    credentials: true
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'publico')));


// Config
const PORT = process.env.PORT || 4000;







// Middleware: 
app.use(express.json());
app.use(cookieParser());

app.use('/api/usuarios', usuarioRutas);
app.use('/api/modelos', ModeloRutas);
app.use('/api/auth', rutaLogIn);
app.use('/api/venta',VentaRutas)
app.use('/api/wsp', wspRutas);
//app.get("/img-proxy", proxyCache);



//index.html 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'publico/index/index.html'));
});


app.listen(PORT, () => console.log(`🚀 Server en http://localhost:${PORT}`));