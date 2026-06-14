let catalogos = {};
let candidatosDisponibles = [];

async function initCrearVotacion() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if(s.tipo !== 'admin'){
    location.href = '/login-admin';
    return;
  }
  catalogos = await fetch('http://localhost:3000/api/catalogos', {
    credentials: 'include'
  }).then(r => r.json());
  llenarSelect('selDistrito', catalogos.distritos, 'distritoId');
  llenarSelect('selCargo', catalogos.cargos, 'cargoId');
  llenarSelect('selPartido', catalogos.partidos, 'partidoId');

  const sel = document.getElementById('nuevoCandPartido');
  catalogos.partidos.forEach(p => {
    const o = document.createElement('option');
    o.value = p.partidoId; o.textContent = p.nombre;
    sel.appendChild(o);
  });
  cargarCandidatos();
}

async function cargarCandidatos() {
  candidatosDisponibles = await fetch('http://localhost:3000/api/candidatos', {
    credentials: 'include'
  }).then(r => r.json());
  renderCandidatos();
}

function renderCandidatos() {
  const grid = document.getElementById('candGrid');
  if(!candidatosDisponibles.length){
    grid.innerHTML = '<p>No hay candidatos. Crea uno abajo.</p>';
    return;
  }
  grid.innerHTML = candidatosDisponibles.map(c => `
    <div>
      <input type="checkbox" id="c${c.candidatoId}" value="${c.candidatoId}">
      <label for="c${c.candidatoId}">${c.nombre}${c.partido ? ' — ' + c.partido : ''}</label>
    </div>`).join('');
  }

  function onTipoChange() {
  const tipo = document.getElementById('tipo').value;
  document.getElementById('grpDistrito').style.display = tipo === 'distrital' ? 'block' : 'none';
  document.getElementById('grpCargo').style.display = tipo === 'institucional' ? 'block' : 'none';
  document.getElementById('grpPartido').style.display = tipo === 'partido' ? 'block' : 'none';
}

async function agregarCandidato() {
  const nombre = document.getElementById('nuevoCandNombre').value.trim();
  const partidoId = document.getElementById('nuevoCandPartido').value || null;
  if(!nombre){
    mostrarAlerta('alerta', 'Ingresa el nombre del candidato.', 'error');
    return;
  }
  const res  = await fetch('http://localhost:3000/api/candidatos', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, partidoId })
  });
  const data = await res.json();
  if(!res.ok){
    mostrarAlerta('alerta', data.error || 'Error.', 'error');
    return;
  }
  document.getElementById('nuevoCandNombre').value = '';
  await cargarCandidatos();
  mostrarAlerta('alerta', 'Candidato creado.', 'exito');
}

async function crearVotacion() {
  const titulo = document.getElementById('titulo').value.trim();
  const tipo   = document.getElementById('tipo').value;
  if(!titulo){
    mostrarAlerta('alerta', 'El título es obligatorio.', 'error');
    return;
  }
  const candidatos = [...document.querySelectorAll('#candGrid input:checked')].map(i => parseInt(i.value));
  if(!candidatos.length){
    mostrarAlerta('alerta', 'Selecciona al menos un candidato.', 'error');
    return;
  }
  const body = { titulo, tipo, candidatos };
  body.fecha_ini = document.getElementById('fecha_ini').value || null;
  body.fecha_fin = document.getElementById('fecha_fin').value || null;
  if(tipo === 'distrital') body.distritoId = document.getElementById('selDistrito').value || null;
  if(tipo === 'institucional') body.cargoId = document.getElementById('selCargo').value || null;
  if(tipo === 'partido') body.partidoId = document.getElementById('selPartido').value || null;
  try {
    const res  = await fetch('http://localhost:3000/api/votaciones/crear', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if(!res.ok){
      mostrarAlerta('alerta', data.error || 'Error.', 'error');
      return;
    }
    mostrarAlerta('alerta', '✅ Votación creada. Redirigiendo...', 'exito');
    setTimeout(() => location.href = '/dashboard', 1400);
  }catch(e){
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

initCrearVotacion();
