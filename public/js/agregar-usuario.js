async function initAgregarUsuario() {
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
  llenarSelect('distrito', cat.distritos, 'distritoId');
  llenarSelect('cargo', cat.cargos, 'cargoId');
  llenarSelect('partido', cat.partidos, 'partidoId');
}

async function guardar() {
  const DNI = document.getElementById('dni').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const distritoId = document.getElementById('distrito').value;
  const cargoId = document.getElementById('cargo').value   || null;
  const partidoId = document.getElementById('partido').value || null;
  if (!DNI || DNI.length !== 8){
    mostrarAlerta('alerta', 'El DNI debe tener 8 caracteres.', 'error');
    return;
  }
  if (!DNI){
    mostrarAlerta('alerta', 'El DNI es obligatorio.', 'error');
    return;
    }
  if(!distritoId){
    mostrarAlerta('alerta', 'El distrito es obligatorio.', 'error');
    return;
  }
  try {
    const res  = await fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ DNI, nombre: nombre || null, distritoId, cargoId, partidoId })
    });
    const data = await res.json();
    if (!res.ok){
      mostrarAlerta('alerta', data.error || 'Error al guardar.', 'error');
      return;
    }
    mostrarAlerta('alerta', 'Usuario creado correctamente.', 'exito');
    document.getElementById('dni').value = '';
    document.getElementById('nombre').value  = '';
    document.getElementById('distrito').value = '';
    document.getElementById('cargo').value = '';
    document.getElementById('partido').value = '';
  }catch(e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

initAgregarUsuario();
