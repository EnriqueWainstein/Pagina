document.addEventListener('DOMContentLoaded', () => {
  const btnCargarVentas = document.getElementById('btnCargarVentas');
  const btnPdfDia = document.getElementById('btnPdfDia');
  const btnPdfSemana = document.getElementById('btnPdfSemana');
  const containerVentas = document.getElementById('ventasContainer');
  const output = document.getElementById('output');
  const getAccessToken = () => localStorage.getItem('accessToken');

  const showOutput = (msg, type = 'info') => {
    output.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
    output.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black';
  };

  const cargarVentas = async () => {
    try {
      const res = await fetch('/api/venta', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
      const ventas = await res.json();

      containerVentas.innerHTML = `
        <h3>📦 Ventas Registradas</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${ventas.map(v => {
              const usuario = v.idUsuario || {};
              const modelos = v.modelos || [];

              return `
                <tr>
                  <td>${usuario.nombre ?? 'Sin nombre'}</td>
                  <td>${usuario.email ?? 'Sin email'}</td>
                  <td>${usuario.rol ?? 'Sin rol'}</td>
                  <td>
                    <ul>
                      ${modelos.map(m => `<li>${m.Modelo?.nombre ?? 'Producto'} x${m.cantidad}</li>`).join('')}
                    </ul>
                  </td>
                  <td>$${v.total?.toFixed(2) ?? 0}</td>
                  <td>${new Date(v.fecha).toLocaleString()}</td>
                  <td><button class="btnEliminarVenta" data-id="${v._id}">🗑️ Eliminar</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      showOutput(`✅ Cargadas ${ventas.length} ventas.`, 'success');
    } catch (err) {
      showOutput('❌ Error cargando ventas: ' + err.message, 'error');
    }
  };

  containerVentas.addEventListener('click', async (ev) => {
    const eliminarBtn = ev.target.closest('.btnEliminarVenta');
    if (!eliminarBtn) return;
    const id = eliminarBtn.dataset.id;
    if (!confirm(`¿Eliminar venta ${id}?`)) return;

    try {
      const res = await fetch(`/api/venta/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      showOutput('✅ Venta eliminada.', 'success');
      cargarVentas();
    } catch (err) {
      showOutput('❌ Error al eliminar venta: ' + err.message, 'error');
    }
  });

  const generarPDF = async (periodo) => {
    try {
      const res = await fetch(`/api/venta/resumen/${periodo}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventas_${periodo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showOutput(`✅ PDF (${periodo}) generado.`, 'success');
    } catch (err) {
      showOutput('❌ Error generando PDF: ' + err.message, 'error');
    }
  };

  btnCargarVentas?.addEventListener('click', cargarVentas);
  btnPdfDia?.addEventListener('click', () => generarPDF('dia'));
  btnPdfSemana?.addEventListener('click', () => generarPDF('semana'));

  // Auto cargar ventas
  cargarVentas();
});
