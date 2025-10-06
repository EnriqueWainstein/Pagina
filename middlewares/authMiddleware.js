import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; 

// Middleware para proteger rutas
export const protegerRuta = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no provisto' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    req.user = payload; // id, email, rol, nombre
    next();
  });
};

// Middleware para verificar roles
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res
        .status(403)
        .json({ error: 'Acceso denegado: rol insuficiente' });
    }
    next();
  };
}


//module.exports = { protegerRuta, authorizeRoles };
