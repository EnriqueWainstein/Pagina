const nodemailer = require("nodemailer");

// Configurá el transporte con Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,          // ⚡ SSL (usar 587 si querés STARTTLS)
  secure: true,
  auth: {
    user: process.env.MAIL_USER, // ventas@tudominio.com
    pass: process.env.MAIL_PASS  // contraseña de la casilla
  }
});

/**
 * Enviar un correo con o sin adjunto
 * @param {string} destinatario - Correo del cliente
 * @param {string} asunto - Asunto del email
 * @param {string} texto - Texto del email
 * @param {string} [adjuntoPath] - Ruta local al archivo PDF
 */
async function enviarMail(destinatario, asunto, texto, adjuntoPath) {
  try {
    const info = await transporter.sendMail({
      from: `"GarageChic" <${process.env.MAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      text: texto,
      attachments: adjuntoPath
        ? [{ filename: "comprobante.pdf", path: adjuntoPath }]
        : []
    });

    console.log("📩 Correo enviado:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Error al enviar correo:", err);
    return false;
  }
}

module.exports = { enviarMail };
