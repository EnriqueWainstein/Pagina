document.addEventListener('DOMContentLoaded', async () => {
  const perfilForm = document.getElementById('perfilForm');
  const mensaje = document.getElementById('mensaje');

  // 🔹 Obtener token del login
  const token = localStorage.getItem('accessToken');

  // Si no hay token → redirigir al login
  if (!token) {
    window.location.href = '/login/login.html';
    return;
  }

  // 🔹 Cargar datos del perfil
  try {
    const res = await fetch('/api/usuarios/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Si el token es inválido o expiró → redirigir
    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      mensaje.textContent = '⚠️ Sesión expirada. Por favor, volvé a iniciar sesión.';
      mensaje.style.color = 'red';
      setTimeout(() => (window.location.href = '/login/login.html'), 2000);
      return;
    }

    if (!res.ok) throw new Error('No se pudo cargar el perfil');

    const usuario = await res.json();

    // Mostrar datos en el formulario
    document.getElementById('nombre').value = usuario.nombre || '';
    document.getElementById('email').value = usuario.email || '';
    document.getElementById('telefono').value = usuario.telefono || '';

  } catch (error) {
    console.error(error);
    mensaje.textContent = '⚠️ Error al cargar tu perfil.';
    mensaje.style.color = 'red';
  }

  // 🔹 Actualizar perfil
  perfilForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const password = document.getElementById('password').value.trim();

    // Crear objeto con los campos a actualizar
    const payload = { nombre, email, telefono };
    if (password) payload.password = password;

    try {
      const res = await fetch('/api/usuarios/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Si el token expiró durante la actualización
      if (res.status === 401) {
        localStorage.removeItem('accessToken');
        mensaje.textContent = '⚠️ Sesión expirada. Por favor, volvé a iniciar sesión.';
        mensaje.style.color = 'red';
        setTimeout(() => (window.location.href = '/login/login.html'), 2000);
        return;
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil');

      // ✅ Éxito
      mensaje.textContent = '✅ Perfil actualizado correctamente.';
      mensaje.style.color = 'green';
      document.getElementById('password').value = ''; // limpiar campo password

    } catch (error) {
      console.error(error);
      mensaje.textContent = '⚠️ ' + error.message;
      mensaje.style.color = 'red';
    }
  });
});
