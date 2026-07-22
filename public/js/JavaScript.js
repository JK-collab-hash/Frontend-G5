function mostrarAlerta(idElemento, mensaje, tipo) {
  const el = document.getElementById(idElemento);
  if(!el){
    return;
  }
  el.textContent = mensaje;
  el.className = tipo;
  el.style.display = 'block';
}

function marcarError(el) {
  if(!el){
    return;
  }
  el.classList.add('is-invalid');
}

function quitarError(el) {
  if (!el) {
    return;
  }
  el.classList.remove('is-invalid');
}

function llenarSelect(id, items, keyId = 'id') {
  const sel = document.getElementById(id);
  if(!sel){
    return;
  }
  items.forEach(i => {
    const o = document.createElement('option');
    o.value = i[keyId];
    o.textContent = i.nombre + (i.tipo ? ` (${i.tipo})` : '');
    sel.appendChild(o);
  });
}

async function cerrarSesion() {
  await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  location.href = '/login-usuario';
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if(!input){
    return;
  }
  const oculto = input.type === 'password';
  input.type = oculto ? 'text' : 'password';

  const iconEye = btn.querySelector('.icon-eye');
  const iconEyeOff = btn.querySelector('.icon-eye-off');
  if(iconEye && iconEyeOff){
    iconEye.style.display = oculto ? 'none' : 'inline-block';
    iconEyeOff.style.display = oculto ? 'inline-block' : 'none';
  }
}