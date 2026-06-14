async function initAgregarAdmin() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if(s.tipo !== 'admin'){
    location.href = '/login-admin';
    return;
  }
  const cat = await fetch('http://localhost:3000/api/catalogos', {
    credentials: 'include'
  }).then(r => r.json());
  const sel = document.getElementById('distrito');
  cat.distritos.forEach(d => {
    const op = document.createElement('option');
    op.value = d.distritoId;
    op.textContent = d.nombre;
    sel.appendChild(op);
  });
}

async function crear() {
  const DNI = document.getElementById('dni').value.trim();
  const contrasena = document.getElementById('pass').value;
  const pass2 = document.getElementById('pass2').value;
  const distritoId = document.getElementById('distrito').value;
  if (!DNI || DNI.length !== 8){
    mostrarAlerta('alerta', 'El DNI debe tener 8 caracteres.', 'error');
    return;
  }
  if(!DNI){
    mostrarAlerta('alerta', 'El DNI es obligatorio.', 'error');
    return;
  }
  if(contrasena.length < 6){
    mostrarAlerta('alerta', 'La contraseña debe tener al menos 6 caracteres.', 'error');
    return;
  }
  if(contrasena !== pass2){
    mostrarAlerta('alerta', 'Las contraseñas no coinciden.', 'error');
    return;
  }
  if(!distritoId){
    mostrarAlerta('alerta', 'El distrito es obligatorio.', 'error');
    return;
  }
  try{
    const res  = await fetch('http://localhost:3000/api/admins', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ DNI, contrasena, distritoId })
    });
    const data = await res.json();
    if(!res.ok){
      mostrarAlerta('alerta', data.error || 'Error al crear.', 'error');
      return;
    }
    mostrarAlerta('alerta', '✅ Administrador creado exitosamente.', 'exito');
    document.getElementById('dni').value = '';
    document.getElementById('pass').value = '';
    document.getElementById('pass2').value = '';
    document.getElementById('distrito').value = '';
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

initAgregarAdmin();
