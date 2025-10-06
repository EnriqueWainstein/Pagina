//const Modelo = require("../../Modelo/Modelo");
//const Modelo = require("../../Modelo/Modelo");
document.addEventListener('DOMContentLoaded', () => {
  const resumenCarrito = document.getElementById('resumen-carrito');
  const resumenTotal = document.getElementById('resumen-total');
  const btnConfirmar = document.getElementById('btnConfirmar');

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  let total = 0;

  carrito.forEach(item => {
    
    const imageUrl = item.linkImagen && item.linkImagen.startsWith('/uploads/')     ? item.linkImagen  : '/placeholder.png'; // fallback si no tiene imagen

    const div = document.createElement('div');
    div.className = 'carrito-item';
    div.innerHTML = `
      <img src="${imageUrl}" alt="${item.nombre}" onerror="this.onerror=null;this.src='/placeholder.png';" />
      <div class="carrito-info">
        <div class="carrito-nombre">${item.nombre}</div>
        <div class="carrito-precio">$${(item.precio * item.cantidad).toFixed(2)}</div>
        <div>Cantidad: ${item.cantidad}</div>
      </div>
    `;
    resumenCarrito.appendChild(div);
    total += item.precio * item.cantidad;
  });

  resumenTotal.textContent = total.toFixed(2);

  btnConfirmar.addEventListener('click', async () => {
    try {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Procesando...";

      const accessToken = localStorage.getItem('accessToken');

      
      const modelos = carrito.map(item => ({
        id: item.id || item._id, // por si viene con distinto nombre
        cantidad: item.cantidad
      }));

      const res = await fetch('/api/venta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ modelos })
      });

      if (!res.ok) {
        alert('Error al crear venta: ' + await res.text());
        return;
      }

      // Descargar PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'comprobante.pdf';
      a.click();
      window.open(url, '_blank');
      URL.revokeObjectURL(url);

      localStorage.removeItem('carrito');
      resumenCarrito.innerHTML = "";
      resumenTotal.textContent = "0";

      alert('Compra confirmada ✅. Recibirás tu comprobante por WhatsApp y/o Email.');

    } catch (err) {
      console.error(err);
      alert('Error al confirmar la compra');
    } finally {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Confirmar Compra";
    }
  });
});
