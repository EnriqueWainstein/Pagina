document.addEventListener('DOMContentLoaded', () => {
  const btnCargarUsuarios = document.getElementById('btnCargarUsuarios');
  const containerUsuarios = document.getElementById('usuariosContainer');
  const output = document.getElementById('output');

  // Modal
  const modal = document.getElementById('modalEditar');
  const cerrarModal = document.getElementById('cerrarModal');
  const cancelarModal = document.getElementById('cancelarModal');
  const formEditar = document.getElementById('formEditarUsuario');

  const getAccessToken = () => localStorage.getItem('accessToken');
  const showOutput = (msg, type = 'info') => {
    output.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
    output.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black';
  };

  const abrirModal = (usuario) => {
    modal.style.display = 'flex';
    document.getElementById('usuarioId').value = usuario._id;
    document.getElementById('editNombre').value = usuario.nombre;
    document.getElementById('editEmail').value = usuario.email;
    document.getElementById('editRol').value = usuario.rol;
    document.getElementById('editTelefono').value = usuario.telefono || '';
  };

  const cerrarModalFn = () => (modal.style.display = 'none');
  cerrarModal.addEventListener('click', cerrarModalFn);
  cancelarModal.addEventListener('click', cerrarModalFn);
  window.addEventListener('click', (e) => { if (e.target === modal) cerrarModalFn(); });

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      const usuarios = await res.json();

      containerUsuarios.innerHTML = '';
      usuarios.forEach(({ _id, nombre, email, rol, telefono }) => {
        const card = document.createElement('div');
        card.className = `usuarioCard role-${rol}`;
        card.innerHTML = `
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Rol:</strong> ${rol}</p>
          <p><strong>Teléfono:</strong> ${telefono || '—'}</p>
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

  // Click en editar o eliminar
  containerUsuarios.addEventListener('click', async (ev) => {
    const editarBtn = ev.target.closest('.btnEditar');
    const eliminarBtn = ev.target.closest('.btnEliminar');

    if (editarBtn) {
      const id = editarBtn.dataset.id;

      // Buscar datos del usuario actual
      const res = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include'
      });
      const usuarios = await res.json();
      const usuario = usuarios.find(u => u._id === id);
      if (usuario) abrirModal(usuario);
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

  // Guardar cambios desde el modal
  formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('editNombre').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const rol = document.getElementById('editRol').value;
    const telefono = document.getElementById('editTelefono').value.trim();

    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ nombre, email, rol, telefono })
      });
      if (!res.ok) throw new Error(await res.text());
      showOutput('✅ Usuario actualizado correctamente.', 'success');
      cerrarModalFn();
      cargarUsuarios();
    } catch (err) {
      showOutput('❌ Error al actualizar usuario: ' + err.message, 'error');
    }
  });

  // Auto cargar
  cargarUsuarios();
});
