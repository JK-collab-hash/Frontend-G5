function mostrarAlerta(idElemento, mensaje, tipo) {
  const el = document.getElementById(idElemento);
  if (!el) return;
  el.textContent = mensaje;
  el.className = tipo; 
  el.style.display = 'block';
}

async function cerrarSesion() {
  await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  location.href = '/login-usuario';
}

function llenarSelect(id, items, keyId = 'id') {
  const sel = document.getElementById(id);
  if(!sel)
    return;
  items.forEach(i => {
    const o = document.createElement('option');
    o.value = i[keyId];
    o.textContent = i.nombre + (i.tipo ? ` (${i.tipo})` : '');
    sel.appendChild(o);
  });
}