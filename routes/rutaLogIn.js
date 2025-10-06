const express = require('express');
const { protegerRuta } = require('../middlewares/authMiddleware');
const { login, refreshToken, logout } = require('../controladores/loginControler');


const router = express.Router();

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protegerRuta, logout);
router.get('/me', protegerRuta, (req, res) => {
  res.json({ usuario: req.user });
});


module.exports = router;
