
document.addEventListener('DOMContentLoaded', () => {
  const btnCargarUsuarios = document.getElementById('btnCargarUsuarios');
  const btnCargarVentas = document.getElementById('btnCargarVentas');
  const btnPdfDia = document.getElementById('btnPdfDia');
  const btnPdfSemana = document.getElementById('btnPdfSemana');
  const containerUsuarios = document.getElementById('usuariosContainer');
  const containerVentas = document.getElementById('ventasContainer');
  const output = document.getElementById('output');

  const getAccessToken = () => localStorage.getItem('accessToken');

  const showOutput = (msg, type = 'info') => {
    if (!output) return;
    output.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
    output.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black';
  };

  // --- Cargar usuarios ---
  const cargarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
      const usuarios = await res.json();
      containerUsuarios.innerHTML = '';
      usuarios.forEach(({ _id, nombre, email, rol }) => {
        const card = document.createElement('div');
        card.className = `usuarioCard role-${rol}`;
        card.innerHTML = `
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Rol:</strong> ${rol}</p>
          <div>
            <button class="btnEditar" data-id="${_id}">✏️ Editar</button>
            <button class="btnEliminar" data-id="${_id}">🗑️ Eliminar</button>
          </div>
        `;
        containerUsuarios.appendChild(card);
      });
      showOutput(`✅ Cargados ${usuarios.length} usuarios.`, 'success');
    } catch (err) {
      showOutput('❌ Error cargando usuarios: ' + err.message, 'error');
    }
  };
  btnCargarUsuarios?.addEventListener('click', cargarUsuarios);

  // --- Editar / Eliminar usuarios ---
  containerUsuarios.addEventListener('click', async (ev) => {
    const editarBtn = ev.target.closest('.btnEditar');
    const eliminarBtn = ev.target.closest('.btnEliminar');

    if (editarBtn) {
      const id = editarBtn.dataset.id;
      const nombre = prompt('Nuevo nombre:');
      const email = prompt('Nuevo email:');
      const rol = prompt('Nuevo rol (usuario/admin/vendedor):');
      if (!nombre || !email || !rol) return;

      try {
        const res = await fetch(`/api/usuarios/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
          },
          credentials: 'include',
          body: JSON.stringify({ nombre, email, rol })
        });
        if (!res.ok) throw new Error(await res.text());
        showOutput(`✅ Usuario actualizado.`, 'success');
        cargarUsuarios();
      } catch (err) {
        showOutput('❌ Error al actualizar usuario: ' + err.message, 'error');
      }
    }

    if (eliminarBtn) {
      const id = eliminarBtn.dataset.id;
      if (!confirm(`¿Eliminar usuario ${id}?`)) return;

      try {
        const res = await fetch(`/api/usuarios/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: 'include'
        });
        if (!res.ok) throw new Error(await res.text());
        showOutput('✅ Usuario eliminado.', 'success');
        cargarUsuarios();
      } catch (err) {
        showOutput('❌ Error al eliminar usuario: ' + err.message, 'error');
      }
    }
  });

  // --- Cargar ventas ---
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
              <th>ID</th>
              <th>Usuario</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${ventas.map(v => `
              <tr>
                <td>${v._id}</td>
                <td>${v.idUsuario?.nombre || 'Sin usuario'}</td>
                <td>
                  <ul>
                    ${v.modelos.map(m => `<li>${m.Modelo?.nombre ?? 'Producto'} x${m.cantidad}</li>`).join('')}
                  </ul>
                </td>
                <td>$${v.total.toFixed(2)}</td>
                <td>${new Date(v.fecha).toLocaleString()}</td>
                <td>
                  <button class="btnEliminarVenta" data-id="${v._id}">🗑️ Eliminar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      showOutput(`✅ Cargadas ${ventas.length} ventas.`, 'success');
    } catch (err) {
      showOutput('❌ Error cargando ventas: ' + err.message, 'error');
    }
  };
  btnCargarVentas?.addEventListener('click', cargarVentas);

  // --- Eliminar venta ---
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

  // --- Generar PDF ---
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
      showOutput(`✅ PDF de ventas (${periodo}) generado.`, 'success');
    } catch (err) {
      showOutput('❌ Error generando PDF: ' + err.message, 'error');
    }
  };
  btnPdfDia?.addEventListener('click', () => generarPDF('dia'));
  btnPdfSemana?.addEventListener('click', () => generarPDF('semana'));
});
