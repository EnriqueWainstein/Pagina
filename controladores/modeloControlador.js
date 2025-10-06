const Modelo = require("../Modelo/Modelo");
const mongoose = require("mongoose");
const path = require("path");

// Crear modelo
const crearModelo = async (req, res) => {
  const { id, nombre, precio, inventario } = req.body;

  // ⚠️ Ahora la imagen se recibe como archivo
  if (!id || !nombre || !precio || !inventario || !req.file) {
    return res.status(400).json({ error: "Faltan datos o imagen para crear el modelo" });
  }

  try {
    const nuevoModelo = await Modelo.create({
      id,
      nombre,
      precio,
      inventario,
      linkImagen: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(nuevoModelo);
  } catch (error) {
    res.status(500).json({
      error: "Error al crear el nuevo modelo. Detalles: " + error.message,
    });
  }
};

// Obtener modelos
const getModelos = async (req, res) => {
  try {
    const modelos = await Modelo.find();

    // ya no necesitas convertir a /img-proxy, solo devolver la ruta
    res.json(modelos);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener modelos. Detalles: " + error.message,
    });
  }
};

// Eliminar modelo
const eliminarModelo = async (req, res) => {
  const { id } = req.params;
  console.log("DELETE recibido para ID:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const modeloEliminado = await Modelo.findByIdAndDelete(id);

    if (!modeloEliminado) {
      return res.status(404).json({ error: "Modelo no encontrado" });
    }

    res.json({ mensaje: "Modelo eliminado correctamente", modelo: modeloEliminado });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar modelo: " + error.message });
  }
};

// Actualizar modelo
const actualizarModelo = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, inventario } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    console.log("Intentando actualizar modelo con ID:", id);

    const updateData = { nombre, precio, inventario };

    // si se subió una nueva imagen, actualizamos la ruta
    if (req.file) {
      updateData.linkImagen = `/uploads/${req.file.filename}`;
    }

    const modeloActualizado = await Modelo.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!modeloActualizado) {
      return res.status(404).json({ error: "Modelo no encontrado" });
    }

    res.json(modeloActualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar modelo: " + error.message });
  }
};

module.exports = { crearModelo, getModelos, actualizarModelo, eliminarModelo };
