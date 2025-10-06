const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Usuario = require("../Modelo/Usuario");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES_IN = '15m';   // access token corto
const REFRESH_EXPIRES_IN = '7d';   // refresh token más largo
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

function generateRefreshToken(usuario) {
  return jwt.sign(
    { id: usuario._id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}


function generateAccessToken(usuario) {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol, name: usuario.nombre },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

// 👉 LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Faltan datos" });

    const usuario = await Usuario.findOne({ email });
    if (!usuario)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const match = await bcrypt.compare(password, usuario.passwordHash);
    if (!match)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    // Guardar refresh token en cookie HttpOnly
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

// 👉 refresh token 
const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No se proporcionó token' });

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    const usuario = await Usuario.findById(payload.id);
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    const newAccessToken = generateAccessToken(usuario);

    res.json({
      accessToken: newAccessToken,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      }
    });
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};


  
// 👉 LOGOUT
const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.json({ message: "Logout exitoso" });
};

module.exports = { login, logout, refreshToken };