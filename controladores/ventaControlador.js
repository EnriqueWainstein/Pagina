const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Modelo = require('../Modelo/Modelo');
const Venta = require('../Modelo/venta');
const { enviarPdf: enviarPdfAPI } = require('../servicioRedes/wspServicio');
const { enviarMail } = require("../servicioRedes/correoServicio");


// ------------------
// Cache de imágenes
// ------------------
const cacheDir = path.join(__dirname, '../publico/cache_imgs');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

const placeholderPath = path.join(__dirname, '../publico/placeholder.png');

async function getCachedImage(url) {
  try {
    let finalUrl = url;
    if (url.startsWith('/')) {
      finalUrl = `${process.env.BASE_URL || 'http://localhost:4000'}${url}`;
    }

    const hash = crypto.createHash('md5').update(finalUrl).digest('hex');
    let ext = path.extname(finalUrl).split('?')[0];
    if (!ext || ext.length > 5) ext = '.jpg';
    const filePath = path.join(cacheDir, `${hash}${ext}`);

    if (fs.existsSync(filePath)) return filePath;

    const res = await axios.get(finalUrl, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(filePath, res.data);
    return filePath;
  } catch (e) {
    console.warn(`⚠️ No se pudo cachear la imagen ${url}:`, e.message);
    return null;
  }
}

async function getCachedImageOrPlaceholder(url) {
  const cached = await getCachedImage(url);
  return cached || placeholderPath;
}


// ------------------
// Crear Venta + PDF
// ------------------
const crearVenta = async (req, res) => {
  try {
    const { modelos, fecha, numeroWhatsapp } = req.body;
    const idUsuario = req.user?.id || req.user?._id;
    if (!idUsuario) return res.status(401).json({ error: 'Usuario no autenticado' });
    if (!Array.isArray(modelos) || modelos.length === 0) {
      return res.status(400).json({ error: 'Faltan productos en la venta' });
    }

    const normalized = modelos.map(p => ({
      modelId: p.id || p._id || p.Modelo,
      cantidad: Number(p.cantidad ?? 0)
    }));

    for (const m of normalized) {
      if (!m.modelId || !mongoose.Types.ObjectId.isValid(m.modelId)) {
        return res.status(400).json({ error: `ID de producto inválido: ${m.modelId}` });
      }
      if (!Number.isFinite(m.cantidad) || m.cantidad <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para producto ${m.modelId}` });
      }
    }

    const modelIds = [...new Set(normalized.map(m => m.modelId))];
    const modelosDB = await Modelo.find({ _id: { $in: modelIds } });
    if (modelosDB.length !== modelIds.length) {
      const foundIds = modelosDB.map(d => String(d._id));
      const missing = modelIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({ error: 'Uno o más productos no existen', missing });
    }

    let total = 0;
    for (const m of normalized) {
      const modeloDB = modelosDB.find(db => db._id.toString() === m.modelId);
      if (modeloDB.inventario < m.cantidad) {
        return res.status(400).json({ error: `No hay suficiente inventario de ${modeloDB.nombre}` });
      }
      total += modeloDB.precio * m.cantidad;
    }

    await Promise.all(
      normalized.map(m =>
        Modelo.findByIdAndUpdate(m.modelId, { $inc: { inventario: -m.cantidad } })
      )
    );

    const modelosVenta = normalized.map(m => ({ Modelo: m.modelId, cantidad: m.cantidad }));
    const nuevaVenta = await Venta.create({
      idUsuario,
      modelos: modelosVenta,
      total,
      fecha: fecha || Date.now()
    });
    const ventaConDetalles = await nuevaVenta.populate('modelos.Modelo');

    const pdfDir = path.join(__dirname, '../publico/pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const pdfPath = path.join(pdfDir, `venta_${nuevaVenta._id}.pdf`);
    const pdfURL = `${process.env.BASE_URL || 'http://localhost:4000'}/pdfs/venta_${nuevaVenta._id}.pdf`;

    // 🔹 Usar placeholder si falla la descarga
    const imagenesCacheadas = await Promise.all(
      ventaConDetalles.modelos.map(m =>
        m.Modelo?.linkImagen ? getCachedImageOrPlaceholder(m.Modelo.linkImagen) : placeholderPath
      )
    );

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(24).fillColor('#333').text('GarageChic', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(18).text('Comprobante de Pedido', { align: 'center' });
    doc.moveDown(2);

    ventaConDetalles.modelos.forEach((m, i) => {
      const cachedPath = imagenesCacheadas[i];
      doc.image(cachedPath, { fit: [80, 80], align: 'left' });

      const subtotal = (m.Modelo?.precio ?? 0) * m.cantidad;
      doc.fontSize(14).fillColor('#000')
        .text(`${m.Modelo?.nombre ?? 'Producto'} x${m.cantidad} - $${subtotal.toFixed(2)}`);
      doc.moveDown();
    });

    doc.moveDown();
    doc.fontSize(16).fillColor('#d32f2f')
      .text(`Total: $${ventaConDetalles.total.toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#777')
      .text('Gracias por su elegir a GarageChic', { align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      if (!res.headersSent) res.sendFile(pdfPath);

      Promise.allSettled([
        numeroWhatsapp ? enviarPdfAPI(numeroWhatsapp, pdfURL) : null,
        req.user?.email
          ? enviarMail(req.user.email, "Pedido - GarageChic", "Adjunto PDF de tu pedido.", pdfPath)
          : null
      ]).catch(console.error);
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al crear el pedido: ' + error.message });
  }
};

// ------------------
// Obtener Ventas
// ------------------
const getVentas = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate('modelos.Modelo')             // Trae info de cada modelo
      .populate('idUsuario', 'nombre email'); // Solo nombre y email del usuario
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas: ' + error.message });
  }
};

// ------------------
// Eliminar Venta
// ------------------
const eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const venta = await Venta.findByIdAndDelete(id);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // ✅ Restaurar stock
    await Promise.all(
      venta.modelos.map(m =>
        Modelo.findByIdAndUpdate(m.Modelo, { $inc: { inventario: m.cantidad } })
      )
    );

    res.json({ mensaje: 'Venta eliminada correctamente', venta });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar venta: ' + error.message });
  }
};
// ------------------
// Generar Resumen PDF
// ------------------
const generarResumenPDF = async (req, res) => {
  try {
    const { periodo } = req.params; // 'dia' o 'semana'
    let fechaInicio;
    const hoy = new Date();

    if (periodo === 'dia') {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    } else if (periodo === 'semana') {
      const diaSemana = hoy.getDay(); // 0 = Domingo
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diaSemana);
    } else {
      return res.status(400).json({ error: 'Periodo inválido' });
    }

    const ventas = await Venta.find({ fecha: { $gte: fechaInicio } })
      .populate('modelos.Modelo')
      .populate('idUsuario', 'nombre');

    const pdfDir = path.join(__dirname, '../publico/pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const pdfPath = path.join(pdfDir, `resumen_${periodo}_${Date.now()}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Encabezado
    doc.fontSize(24).text('GarageChic', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(18).text(`Resumen de ventas (${periodo})`, { align: 'center' });
    doc.moveDown(2);

    let totalGeneral = 0;
    ventas.forEach(v => {
      doc.fontSize(14).text(
        `Venta ID: ${v._id} - Usuario: ${v.idUsuario?.nombre || 'Desconocido'} - Fecha: ${v.fecha.toLocaleString()}`
      );
      v.modelos.forEach(m => {
        const subtotal = (m.Modelo?.precio ?? 0) * m.cantidad;
        doc.fontSize(12).text(`   ${m.Modelo?.nombre ?? 'Producto'} x${m.cantidad} - $${subtotal.toFixed(2)}`);
      });
      doc.fontSize(12).fillColor('#d32f2f').text(`   Total venta: $${v.total.toFixed(2)}`);
      totalGeneral += v.total;
      doc.moveDown();
    });

    doc.moveDown();
    doc.fontSize(16).fillColor('#000')
      .text(`Total acumulado: $${totalGeneral.toFixed(2)}`, { align: 'right' });
    doc.end();

    writeStream.on('finish', () => {
      if (!res.headersSent) res.sendFile(pdfPath);
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al generar PDF: ' + error.message });
  }
};




module.exports = { crearVenta, getVentas,eliminarVenta, generarResumenPDF };  