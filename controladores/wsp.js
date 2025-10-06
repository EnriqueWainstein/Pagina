const { enviarPdf: enviarPdfAPI } = require('../servicioRedes/wspServicio'); // importamos la función axios

// Handler de Express
const enviarPdf = async (req, res) => {
  const { numero, urlPDF } = req.body;
  if (!numero || !urlPDF) {
    return res.status(400).json({ success: false, error: 'Faltan numero o urlPDF' });
  }

  try {
    const data = await enviarPdfAPI(numero, urlPDF); 
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

module.exports = { enviarPdf };
