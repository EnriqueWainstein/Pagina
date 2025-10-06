
document.getElementById('crearUsuarioBTN').addEventListener('submit', async (event) => {
  event.preventDefault();

  const nombre = document.getElementById('nombre')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const codigoPais = document.getElementById('codigoPais')?.value;
  const telefonoInput = document.getElementById('telefono')?.value.replace(/\D/g, ''); 

  if (!nombre || nombre.length < 2 || nombre.length > 20) {
    alert('⚠️ El nombre debe tener entre 2 y 20 caracteres.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    alert('⚠️ Por favor, ingrese un email válido.');
    return;
  }

  if (!password || password.length < 6) {
    alert('⚠️ La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  // Combinar código de país + número
  const telefono = `${codigoPais}${telefonoInput}`;
  const phoneRegex = /^\+[1-9]\d{7,14}$/;
  if (!phoneRegex.test(telefono)) {
    alert('⚠️ El número debe estar en formato válido. Ej: +5491134567890');
    return;
  }

  const payload = { nombre, email, password, telefono };

  try {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok && data?._id) {
      alert('✅ Usuario creado correctamente');
      window.location.href = '/index/index.html';
    } else {
      alert(`❌ Error al crear el usuario: ${data.error || 'Intente nuevamente.'}`);
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    alert('❌ Error de red o servidor. Intente más tarde.');
  }
});
