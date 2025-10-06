const Usuario = require("../Modelo/Usuario");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// Registrar usuario
const registroUsuario = async (req, res) => {
  const { nombre, email, password, rol, telefono } = req.body; 

  
  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ error: "Faltan datos para crear el usuario" });
  }

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("datos recibidos:", { nombre, email, rol, telefono });

    
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      passwordHash: hashedPassword,
      telefono, 
    });

    
    const { passwordHash, refreshTokens, ...userData } = nuevoUsuario.toObject();
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({
      error: "Error al crear el nuevo usuario. Detalles: " + error.message,
    });
  }
};


const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  console.log("DELETE recibido para ID:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(id);

    if (!usuarioEliminado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      mensaje: "Usuario eliminado correctamente",
      Usuario: usuarioEliminado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al eliminar usuario: " + error.message });
  }
};


const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, telefono } = req.body; 

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    console.log("Intentando actualizar Usuario con ID:", id);

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { nombre, email, rol, telefono }, 
      { new: true, runValidators: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuarioActualizado);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al actualizar usuario: " + error.message });
  }
};


const getUsuarios = async (req, res) => {
  const { rol } = req.query; 

  try {
    const filtro = rol ? { rol } : {};
    const usuarios = await Usuario.find(filtro).select(
      "-passwordHash -refreshTokens"
    );
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener usuarios. Detalles: " + error.message,
    });
  }
};

const getPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select(
      "-passwordHash -refreshTokens"
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener perfil. Detalles: " + error.message,
    });
  }
};


const actualizarPerfil = async (req, res) => {
  const { nombre, email, telefono, password } = req.body;

  try {
  
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email;
    if (telefono) updateData.telefono = telefono;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.user.id,   // 🔒 Solo el usuario logueado
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshTokens');

    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuarioActualizado);
  } catch (error) {
    res.status(500).json({
      error: 'Error al actualizar perfil. Detalles: ' + error.message,
    });
  }
};

module.exports = {
  registroUsuario,
  getUsuarios,
  eliminarUsuario,
  actualizarUsuario,
  getPerfil,      
  actualizarPerfil, 
};



