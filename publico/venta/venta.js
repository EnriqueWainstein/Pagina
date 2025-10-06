
document.addEventListener('DOMContentLoaded', () => {
  const carrito = [];
  const carritoLista = document.getElementById('carrito-lista');
  const carritoTotal = document.getElementById('carrito-total');
  const abrirCarritoBtn = document.getElementById('abrirCarrito');
  const cerrarCarritoBtn = document.getElementById('cerrarCarrito');
  const carritoPanel = document.getElementById('carrito');

  // abrir/cerrar carrito
  abrirCarritoBtn.addEventListener('click', () => carritoPanel.classList.add('abierto'));
  cerrarCarritoBtn.addEventListener('click', () => carritoPanel.classList.remove('abierto'));

  // render carrito
  function renderCarrito() {
    carritoLista.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'carrito-item';
      li.innerHTML = `
        <img src="${item.linkImagen ? item.linkImagen : '/uploads/placeholder.png'}" 
             alt="${item.nombre}" class="mini-img" />
        <div class="carrito-info">
          <div class="carrito-nombre">${item.nombre}</div>
          <div class="carrito-precio">$${(item.precio * item.cantidad).toFixed(2)}</div>
          <div class="carrito-qty">
            <button class="cart-minus" data-index="${index}">-</button>
            <input type="number" class="cart-input" data-index="${index}" 
                   value="${item.cantidad}" min="1" max="${item.inventario}">
            <button class="cart-plus" data-index="${index}">+</button>
          </div>
        </div>
        <button class="eliminar-item" data-index="${index}">❌</button>
      `;
      carritoLista.appendChild(li);
      total += item.precio * item.cantidad;
    });

    carritoTotal.textContent = total.toFixed(2);

    // listeners carrito
    carritoLista.querySelectorAll('.cart-plus').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        const it = carrito[idx];
        if (it.cantidad < it.inventario) {
          it.cantidad += 1;
          renderCarrito();
        } else {
          alert(`Solo hay ${it.inventario} unidades disponibles de ${it.nombre}`);
        }
      });
    });

    carritoLista.querySelectorAll('.cart-minus').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        const it = carrito[idx];
        if (it.cantidad > 1) {
          it.cantidad -= 1;
          renderCarrito();
        }
      });
    });

    carritoLista.querySelectorAll('.cart-input').forEach(input => {
      input.addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        let val = parseInt(e.target.value, 10) || 1;
        if (val < 1) val = 1;
        if (val > carrito[idx].inventario) {
          alert(`No puedes pedir más de ${carrito[idx].inventario} unidades de ${carrito[idx].nombre}`);
          val = carrito[idx].inventario;
        }
        carrito[idx].cantidad = val;
        renderCarrito();
      });
    });

    carritoLista.querySelectorAll('.eliminar-item').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        carrito.splice(idx, 1);
        renderCarrito();
      });
    });

    document.getElementById('confirmarCompra').addEventListener('click', () => {
      localStorage.setItem('carrito', JSON.stringify(carrito));
      window.location.href = '../confirmarVentas/confirmarVenta.html';
    });
  }

  // listar modelos
  async function listarModelos() {
    try {
      const res = await fetch('/api/modelos');
      const modelos = await res.json();

      const container = document.getElementById('tableBody');
      container.innerHTML = '';

      modelos.forEach(m => {
        const card = document.createElement('div');
        card.classList.add('modelo-card-grid');

        // fallback si no hay imagen
        const imgSrc = m.linkImagen ? m.linkImagen : '/uploads/placeholder.png';
        const agotado = m.inventario === 0;

        card.innerHTML = `
          <img src="${imgSrc}" alt="${m.nombre}" class="modelo-img-grid" />
          <h3>${m.nombre}</h3>
          <p><strong>Precio:</strong> $${m.precio.toFixed(2)}</p>
          <p><strong>Stock:</strong> ${m.inventario}</p>

          <div class="cantidad-control">
            <button class="menos-btn" ${agotado ? 'disabled' : ''}>-</button>
            <input type="number" class="cantidad-input" value="1" 
                   min="1" max="${m.inventario}" ${agotado ? 'disabled' : ''}>
            <button class="mas-btn" ${agotado ? 'disabled' : ''}>+</button>
          </div>

          <div class="acciones">
            <button class="carrito-btn" data-id="${m._id}" ${agotado ? 'disabled' : ''}>
              ${agotado ? 'Agotado' : 'Agregar al carrito'}
            </button>
          </div>
        `;

        container.appendChild(card);

        // controles card
        const menosBtn = card.querySelector('.menos-btn');
        const masBtn = card.querySelector('.mas-btn');
        const input = card.querySelector('.cantidad-input');
        const carritoBtn = card.querySelector('.carrito-btn');

        if (input) {
          input.addEventListener('change', () => {
            let val = parseInt(input.value, 10) || 1;
            if (val < 1) val = 1;
            if (val > m.inventario) val = m.inventario;
            input.value = val;
          });
        }

        if (menosBtn) {
          menosBtn.addEventListener('click', () => {
            let val = parseInt(input.value, 10);
            if (val > 1) input.value = val - 1;
          });
        }

        if (masBtn) {
          masBtn.addEventListener('click', () => {
            let val = parseInt(input.value, 10);
            if (val < m.inventario) {
              input.value = val + 1;
            } else {
              input.value = m.inventario;
              alert(`Solo hay ${m.inventario} unidades disponibles de ${m.nombre}`);
            }
          });
        }

        carritoBtn.addEventListener('click', () => {
          const cantidad = parseInt(input.value, 10) || 1;
          const existente = carrito.find(item => item.id === m._id);

          if (existente) {
            if (existente.cantidad + cantidad > m.inventario) {
              alert(`No puedes agregar más de ${m.inventario} unidades de ${m.nombre}`);
              return;
            }
            existente.cantidad += cantidad;
          } else {
            if (cantidad > m.inventario) {
              alert(`Solo hay ${m.inventario} unidades disponibles de ${m.nombre}`);
              return;
            }
            carrito.push({
              id: m._id,
              nombre: m.nombre,
              precio: m.precio,
              cantidad,
              inventario: m.inventario,
              linkImagen: imgSrc
            });
          }

          renderCarrito();
          carritoPanel.classList.add('abierto');
        });
      });
    } catch (err) {
      console.error('Error al listar modelos:', err);
      alert('Error al cargar productos. Revisa la consola.');
    }
  }

  listarModelos();
});


