let usuarioSesion = null;

async function initVotacion(){
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if(s.tipo !== 'usuario'){
    location.href = '/login-usuario';
    return;
  }
  usuarioSesion = s.data;
  document.getElementById('wNombre').textContent = usuarioSesion.nombre || `DNI: ${usuarioSesion.DNI}`;
  document.getElementById('wDetalle').textContent = [usuarioSesion.cargo, usuarioSesion.partido, usuarioSesion.distrito].filter(Boolean).join(' · ') || 'Sin clasificación especial';
  cargarVotaciones();
}

async function cargarVotaciones(){
  const container = document.getElementById('votaciones-container');
  try {
    const data = await fetch('http://localhost:3000/api/votaciones/disponibles', {
      credentials: 'include'
    }).then(r => r.json());
    if(!Array.isArray(data) || data.length === 0){
      container.innerHTML = '<p>No hay votaciones disponibles para tu perfil en este momento.</p>';
      return;
    }
    container.innerHTML = data.map(v => renderVotacion(v)).join('');
  }catch(e){
    container.innerHTML = '<p>Error al cargar votaciones.</p>';
  }
}

function renderVotacion(v) {
  const opciones = v.candidatos.map(c =>
    `<option value="${c.candidatoId}">${c.nombre}${c.partido ? ' — ' + c.partido : ''}</option>`
  ).join('');
  return `
    <div id="sec-${v.votacionId}">
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

async function votar(votacionId){
  const candidatoId = document.getElementById(`sel-${votacionId}`).value;
  if(!candidatoId){
    mostrarAlerta(`msg-${votacionId}`, 'Selecciona un candidato primero.', 'error');
    return;
  }
  try {
    const res  = await fetch('http://localhost:3000/api/votaciones/votar', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votacionId, candidatoId: parseInt(candidatoId) })
    });
    const data = await res.json();
    if(!res.ok){
      mostrarAlerta(`msg-${votacionId}`, data.error || 'Error al votar.', 'error');
      return;
    }
    document.getElementById(`action-${votacionId}`).innerHTML = '<p id="voto-confirmado">Voto registrado correctamente</p>';
    mostrarAlerta(`msg-${votacionId}`, '¡Tu voto fue emitido con exito!', 'exito');
  }catch(e){
    mostrarAlerta(`msg-${votacionId}`, 'Error', 'error');
  }
  }

  initVotacion();
