async function ingresar() {
  const dniEl = document.getElementById('dni');
  const passEl = document.getElementById('pass');
  const dni = dniEl.value.trim();
  const contraseña = passEl.value;

  let valido = true;

  if(!dni || dni.length !== 8){
    marcarError(dniEl);
    valido = false;
  }else{
    quitarError(dniEl);
  }

  if(!contraseña) {
    marcarError(passEl);
    valido = false;
  }else{
    quitarError(passEl);
  }

  if(!valido) {
    return;
  }

  try{
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, contraseña })
    });
    const data = await res.json();

    if(!res.ok){
      marcarError(dniEl);
      marcarError(passEl);
      mostrarAlerta('alerta', data.error || 'Credenciales incorrectas.', 'error');
      return;
    }

    if (data.usuario.rol === 'admin'){
      location.href = '/dashboard';
    }else{
      location.href = '/votacion';
    }
  }catch(e){
    mostrarAlerta('alerta', 'Error de conexión con el servidor.', 'error');
  }
}

async function enviarSolicitudCambioContraseña() {
  const dniEl = document.getElementById('cc-dni');
  const nombreEl = document.getElementById('cc-nombre');
  const actualEl = document.getElementById('cc-actual');
  const nuevaEl = document.getElementById('cc-nueva');
  const confirmarEl = document.getElementById('cc-confirmar');
  const alertaEl = document.getElementById('cc-alerta');
  alertaEl.innerHTML = '';

  const dni = dniEl.value.trim();
  const nombre = nombreEl.value.trim();
  const contraseñaActual = actualEl.value;
  const contraseñaNueva = nuevaEl.value;
  const confirmar = confirmarEl.value;

  let valido = true;

  if (!dni || dni.length !== 8) {
    marcarError(dniEl);
    valido = false;
  } else {
    quitarError(dniEl);
  }

  if (!nombre) {
    marcarError(nombreEl);
    valido = false;
  } else {
    quitarError(nombreEl);
  }

  if (!contraseñaActual) {
    marcarError(actualEl);
    valido = false;
  } else {
    quitarError(actualEl);
  }

  if (!contraseñaNueva || contraseñaNueva.length < 9) {
    marcarError(nuevaEl);
    valido = false;
  } else if (contraseñaActual && contraseñaNueva === contraseñaActual) {
    marcarError(nuevaEl);
    valido = false;
  } else {
    quitarError(nuevaEl);
  }

  if (!confirmar || confirmar !== contraseñaNueva) {
    marcarError(confirmarEl);
    valido = false;
  } else {
    quitarError(confirmarEl);
  }

  if (!valido) {
    const mensaje = (contraseñaNueva && contraseñaActual && contraseñaNueva === contraseñaActual)
      ? 'La nueva contraseña no puede ser igual a la actual.'
      : 'Corrige los campos marcados en rojo.';
    alertaEl.innerHTML = `<div class="alert alert-danger py-2">${mensaje}</div>`;
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/solicitar-cambio-contrasena', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, nombre, contraseñaActual, contraseñaNueva })
    });
    const data = await res.json();
    if (!res.ok) {
      alertaEl.innerHTML = `<div class="alert alert-danger py-2">${data.error || 'No se pudo enviar la solicitud.'}</div>`;
      return;
    }
    alertaEl.innerHTML = `<div class="alert alert-success py-2">${data.mensaje}</div>`;
    [dniEl, nombreEl, actualEl, nuevaEl, confirmarEl].forEach(el => { el.value = ''; quitarError(el); });
  } catch (e) {
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">Error de conexión con el servidor.</div>';
  }
}
