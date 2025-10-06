const axios = require('axios');

const token = 'TOKEN';
const whatsappId = 'WHATSAPP_BUSINESS_ID';

async function enviarPdf(numero, urlPDF) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${whatsappId}/messages`,
      {
        messaging_product: "whatsapp",
        to: numero,
        type: "document",
        document: {
          link: urlPDF,
          filename: "comprobante.pdf"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

module.exports = { enviarPdf };
