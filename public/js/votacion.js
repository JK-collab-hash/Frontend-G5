let usuarioSesion = null;

async function initVotacion() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if(s.tipo !== 'usuario'){
    location.href = '/login-usuario';
    return;
  }
  usuarioSesion = s.data;
  document.getElementById('wNombre').textContent = usuarioSesion.nombre || `DNI: ${usuarioSesion.DNI}`;
  await cargarDetalleUsuario();
  cargarVotaciones();
}

async function cargarDetalleUsuario(){
  try{
    const organizaciones = await fetch(`http://localhost:3000/api/usuarios/${usuarioSesion.DNI}/organizaciones`,{
      credentials: 'include'
    }).then(r => r.json());
    const nombresOrganizaciones = Array.isArray(organizaciones)
      ? organizaciones.map(o => o.nombre)
      : [];
    const detalle = [usuarioSesion.cargo, ...nombresOrganizaciones, usuarioSesion.distrito]
      .filter(Boolean)
      .join(' · ');
    document.getElementById('wDetalle').textContent = detalle || 'Sin clasificación especial';
  }catch(e){
    document.getElementById('wDetalle').textContent = [usuarioSesion.cargo, usuarioSesion.distrito].filter(Boolean).join(' · ') || 'Sin clasificación especial';
  }
}

async function cargarVotaciones() {
  const container = document.getElementById('votaciones-container');
  try{
    const data = await fetch('http://localhost:3000/api/votaciones/disponibles', {
      credentials: 'include'
    }).then(r => r.json());
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p>No hay votaciones disponibles para ti en este momento.</p>';
      return;
    }
    container.innerHTML = data.map(v => v.tipo === 'referendum' ? renderReferendum(v) : renderVotacion(v)).join('');
  }catch(e){
    container.innerHTML = '<p>Error al cargar las elecciones.</p>';
  }
}

function renderVotacion(v){
  const opciones = v.candidatos.map(c =>
    `<option value="${c.candidatoId}">${c.nombre}${c.organizacion ? ' — ' + c.organizacion : ''}</option>`
  ).join('');
  return `
    <div id="sec-${v.votacionId}" class="card border-0 shadow-sm mb-3 p-3">
      <h3>${v.titulo}</h3>
      <p>${v.tipo} — ${v.candidatos.length} candidato(s)</p>
      <div id="action-${v.votacionId}">
        <select id="sel-${v.votacionId}">
          <option value="">Selecciona un candidato</option>
          ${opciones}
        </select>
        <button onclick="votar(${v.votacionId})">Votar</button>
      </div>
      <div id="msg-${v.votacionId}"></div>
    </div>`;
}

function renderReferendum(v){
  const norma = v.norma;
  if(!norma){
    return `<div id="sec-${v.votacionId}" class="card border-0 shadow-sm mb-3 p-3">
    <h3>${v.titulo}</h3>
    <p class="text-muted">Este referéndum no tiene una norma asociada todavía.</p>
    </div>`;
  }
  return `<div id="sec-${v.votacionId}" class="card border-0 shadow-sm mb-3 p-3">
  <h3>${v.titulo}</h3>
  <p class="fw-semibold mb-1">${norma.titulo}</p>
  ${norma.descripcion ? `<p class="text-muted">${norma.descripcion}</p>` : ''}
  <div id="action-${v.votacionId}">
    <button class="btn btn-success me-2" onclick="votarReferendum(${v.votacionId}, 'a_favor')">A favor</button>
    <button class="btn btn-outline-danger" onclick="votarReferendum(${v.votacionId}, 'en_contra')">En contra</button>
  </div>
  <div id="msg-${v.votacionId}"></div>
  </div>`;
}

async function votar(votacionId) {
  const candidatoId = document.getElementById(`sel-${votacionId}`).value;
  if(!candidatoId){
    mostrarAlerta(`msg-${votacionId}`, 'Selecciona un candidato.', 'error');
    return;
  }
  try{
    const res = await fetch('http://localhost:3000/api/votaciones/votar', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({votacionId, candidatoId: parseInt(candidatoId)})
    });
    const data = await res.json();
    if(!res.ok){
      mostrarAlerta(`msg-${votacionId}`, data.error || 'Error al votar.', 'error');
      return;
    }
    document.getElementById(`action-${votacionId}`).innerHTML = '<p id="voto-confirmado">Voto registrado correctamente</p>';
    mostrarAlerta(`msg-${votacionId}`, '¡Tu voto fue emitido con exito!', 'exito');
  }catch(e){
    mostrarAlerta(`msg-${votacionId}`, 'Error al emitir tu voto.', 'error');
  }
}

async function votarReferendum(votacionId, opcion) {
  try{
    const res = await fetch('http://localhost:3000/api/votaciones/votar', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votacionId, opcion })
    });
    const data = await res.json();
    if(!res.ok){
      mostrarAlerta(`msg-${votacionId}`, data.error || 'Error al votar.', 'error');
      return;
    }
    document.getElementById(`action-${votacionId}`).innerHTML = '<p id="voto-confirmado">Voto registrado correctamente</p>';
    mostrarAlerta(`msg-${votacionId}`, '¡Tu voto fue emitido con exito!', 'exito');
  }catch(e){
    mostrarAlerta(`msg-${votacionId}`, 'Error al emitir tu voto.', 'error');
  }
}

initVotacion();