const form = document.getElementById('modeloForm');
const tableBody = document.querySelector('#modeloTable tbody');
const modal = document.getElementById('modalEditar');
const editarForm = document.getElementById('editarForm');
let modeloActual = null;

// Listar modelos
// Listar modelos
async function listarModelos() {
  try {
    const res = await fetch('/api/modelos');
    const modelos = await res.json();

    tableBody.innerHTML = '';
    modelos.forEach(m => {
      const imgSrc = m.linkImagen ? m.linkImagen : '/uploads/placeholder.png';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${m._id}</td>
        <td>${m.nombre}</td>
        <td>$${m.precio.toFixed(2)}</td>
        <td>
          <img src="${imgSrc}" 
               alt="${m.nombre}" 
               class="mini-img" 
               onerror="this.src='/uploads/placeholder.png'" />
        </td>
        <td>${m.inventario}</td>
        <td><button class="editar-btn" data-id="${m._id}">Editar</button></td>
        <td><button class="eliminar-btn" data-id="${m._id}">Eliminar</button></td>
      `;
      tableBody.appendChild(row);
    });

    // Botones eliminar
    document.querySelectorAll('.eliminar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modelo = modelos.find(m => m._id === btn.dataset.id);
        eliminarModelo(modelo);
      });
    });

    // Botones editar
    document.querySelectorAll('.editar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modelo = modelos.find(m => m._id === btn.dataset.id);
        abrirModal(modelo);
      });
    });

  } catch (err) {
    console.error('Error listando modelos:', err);
  }
}


// Eliminar modelo
async function eliminarModelo(modelo) {
  const confirmar = confirm(`¿Eliminar el modelo "${modelo.nombre}"?`);
  if (!confirmar) return;

  try {
    const res = await fetch(`/api/modelos/${modelo._id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok) {
      alert('✅ Modelo eliminado correctamente');
      document.querySelector(`[data-id="${modelo._id}"]`)?.closest('tr')?.remove();
    } else {
      alert('❌ Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al eliminar modelo:', err);
    alert('❌ Error inesperado al eliminar el modelo');
  }
}

// Abrir modal con datos del modelo
function abrirModal(modelo) {
  modeloActual = modelo;
  editarForm.nombre.value = modelo.nombre;
  editarForm.precio.value = modelo.precio;
  editarForm.inventario.value = modelo.inventario;
  modal.style.display = 'flex';
}

// Cerrar modal
document.getElementById('cerrarModal').addEventListener('click', () => {
  modal.style.display = 'none';
  modeloActual = null;
});

// Guardar cambios (con imagen opcional)
editarForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!modeloActual) return;

  const formData = new FormData(editarForm);

  try {
    const res = await fetch(`/api/modelos/${modeloActual._id}`, {
      method: 'PUT',
      body: formData // ✅ permite actualizar imagen
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Error al actualizar modelo: ' + (err.error || 'Error desconocido'));
      return;
    }

    modal.style.display = 'none';
    modeloActual = null;
    listarModelos();
  } catch (err) {
    console.error('Error en fetch:', err);
  }
});

// Crear modelo (con imagen obligatoria)
form.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(form); // ⚡ importante, no JSON.stringify

  try {
    const res = await fetch('/api/modelos', {
      method: 'POST',
      body: formData // no headers, se arma solo
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Error creando modelo: ' + (err.error || 'Error desconocido'));
      return;
    }

    form.reset();
    listarModelos();

  } catch (err) {
    console.error('Error en fetch:', err);
    alert('Error de conexión con el servidor');
  }
});

// Carga inicial
document.addEventListener('DOMContentLoaded', listarModelos);
