document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logout");
  const perfilBtn = document.getElementById("idPerfil");
  const botonLoginAlternativo = document.getElementById("botonLoginAlternativo");

  // Por defecto oculto
  perfilBtn.style.display = "none";

  // Recuperar lo guardado
  let accessToken = localStorage.getItem("accessToken");
  let usuario = localStorage.getItem("usuario");
  if (usuario) usuario = JSON.parse(usuario);

  const mostrarUI = (usuario) => {
    document.getElementById('botonVenta').style.display = 'inline';
    logoutBtn.style.display = 'inline';
    loginBtn.style.display = 'none';
    perfilBtn.style.display = 'inline';

    if (usuario?.rol === 'admin') {
      document.getElementById('botonAdmin1').style.display = 'inline';
    }
  };

  if (accessToken) {
    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn("Token inválido o expirado");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("usuario");

        // 👇 fallback: si había usuario guardado, usarlo igual
        if (usuario) {
          console.warn("Usando usuario de localStorage como fallback");
          mostrarUI(usuario);
        } else {
          botonLoginAlternativo.style.display = "block";
        }
      } else {
        // ✅ Guardar token nuevo
        localStorage.setItem("accessToken", data.accessToken);

        // ✅ Guardar usuario actualizado
        if (data.usuario) {
          usuario = data.usuario;
          localStorage.setItem("usuario", JSON.stringify(usuario));
        }

        mostrarUI(usuario);
      }
    } catch (err) {
      console.error("Error verificando sesión:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("usuario");

      // 👇 fallback en error de red
      if (usuario) {
        console.warn("Usando usuario de localStorage como fallback");
        mostrarUI(usuario);
      } else {
        botonLoginAlternativo.style.display = "block";
      }
    }
  } else {
    // No logueado
    botonLoginAlternativo.style.display = "block";
  }

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    localStorage.removeItem("accessToken");
    localStorage.removeItem("usuario");
    window.alert("Sesión cerrada");
    loginBtn.style.display = "inline";
    perfilBtn.style.display = "none";
    document.getElementById("botonAdmin1").style.display = "none";
    document.getElementById("botonVenta").style.display = "none";
    logoutBtn.style.display = "none";
    botonLoginAlternativo.style.display = "block";
  });

  // --- Listar modelos para la tienda ---
  async function listarModelosTienda() {
    try {
      const res = await fetch('/api/modelos');
      if (!res.ok) throw new Error("Error al cargar modelos");

      const modelos = await res.json();
      const contenedor = document.getElementById("productos");
      contenedor.innerHTML = '';

      modelos.forEach(m => {
        const card = document.createElement('div');
        card.className = 'producto';
        card.innerHTML = `
          <h3>${m.nombre}</h3>
          <p><strong>Precio:</strong> $${m.precio.toFixed(2)}</p>
          <div class="imagen-container">
            <img src="${m.linkImagen}" alt="${m.nombre}" class="imagen-modelo">
          </div>
          <p><strong>Stock:</strong> ${m.inventario}</p>
        `;
        contenedor.appendChild(card);
      });
    } catch (err) {
      console.error("No se pudieron cargar los modelos:", err);
    }
  }

  // 👇 Siempre cargar productos
  listarModelosTienda();
});
