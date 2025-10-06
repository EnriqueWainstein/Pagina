// frontend login.js
const loginForm = document.getElementById("loginForm");
const mensajeDiv = document.getElementById("mensaje");
let accessToken = null;

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include" // 👈 envía/recibe cookies (refreshToken)
    });

    const data = await res.json();

    if (res.ok) {
      // 👉 Guardar accessToken siempre actualizado
      accessToken = data.accessToken;
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }

      // 👉 Guardar también el rol por si lo necesitás en frontend
      if (data.usuario?.rol) {
        localStorage.setItem("rol", data.usuario.rol);
      }

      console.log("Access token:", accessToken);
      console.log("Rol:", data.usuario?.rol);

      // Redirigir al index
      setTimeout(() => {
        window.location.href = "../index/index.html";
      }, 100);
    } else {
      mensajeDiv.innerText = data.error || "Error en el login";
    }
  } catch (err) {
    console.error("Error:", err);
    mensajeDiv.innerText = "Error en la conexión al servidor";
  }
});
