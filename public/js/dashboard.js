let votacionesData = [];

async function initDashboard() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if(s.tipo !== 'admin'){
    location.href = '/login-admin';
    return;
  }
  cargarResultados();
  cargarVotacionesAdmin();
}

async function cargarResultados() {
  try{
    const data = await fetch('http://localhost:3000/api/votaciones/resultados', {
      credentials: 'include'
    }).then(r => r.json());
    renderResultados(data);
  }catch(e){
    document.getElementById('resultadosContainer').innerHTML = '<p>Error al cargar.</p>';
  }
}

function renderResultados(rows) {
  const container = document.getElementById('resultadosContainer');
  if(!rows || rows.length === 0){
    container.innerHTML = '<p>No hay votos registrados aún.</p>'; return;
  }

  const grouped = {};
  rows.forEach(r => {
    if(!r.candidato)
      return;
    if(!grouped[r.votacionId])
      grouped[r.votacionId] = { titulo: r.titulo, tipo: r.tipo, activa: r.activa, candidatos: [] };
      grouped[r.votacionId].candidatos.push({ nombre: r.candidato, partido: r.partido, votos: r.total_votos });
    });
  let html = '';
  Object.entries(grouped).forEach(([id, v]) => {
    html += `
      <div class="mb-4">
        <div class="d-flex align-items-center gap-3 mb-2">
          <h3 class="mb-0">${v.titulo} (${v.tipo})</h3>
          <button 
            id="btn-toggle-${id}"
            class="btn btn-sm ${v.activa ? 'btn-success' : 'btn-secondary'}" 
            onclick="toggleVotacion(${id})">
            ${v.activa ? 'Activa' : 'Finalizada'}
          </button>
        </div>`;
    v.candidatos.forEach(c => {
      html += `<p>${c.nombre}${c.partido ? ' — ' + c.partido : ''}: <strong>${c.votos} voto(s)</strong></p>`;
    });
    html += '</div>';
  });
  document.getElementById('statVotaciones').textContent = Object.keys(grouped).length;
  container.innerHTML = html;
}

async function toggleVotacion(votacionId) {
  try{
    const res = await fetch(`http://localhost:3000/api/votaciones/toggle/${votacionId}`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if(!res.ok){
      alert(data.error || 'Error al cambiar estado.');
      return;
    }
    const btn = document.getElementById(`btn-toggle-${votacionId}`);
    if(data.activa){
      btn.className = 'btn btn-sm btn-success';
      btn.textContent = 'Activa';
    } else {
      btn.className = 'btn btn-sm btn-secondary';
      btn.textContent = 'Finalizada';
    }
  }catch(e){
    alert('Error');
  }
}

async function cargarVotacionesAdmin() {
  const res = await fetch('http://localhost:3000/api/votaciones/disponibles', {
    credentials: 'include'
  }).then(r => r.json());
  votacionesData = Array.isArray(res) ? res : [];
  const sel = document.getElementById('selVotAdmin');
  if (!sel)
    return;
  votacionesData.forEach(v => {
    const o = document.createElement('option');
    o.value = v.votacionId; o.textContent = v.titulo;
    sel.appendChild(o);
  });
}

function cargarCandidatosAdmin() {
  const vid = parseInt(document.getElementById('selVotAdmin').value);
  const sel = document.getElementById('selCandAdmin');
  sel.innerHTML = '<option value="">— Elige un candidato —</option>';
  const vot = votacionesData.find(v => v.votacionId === vid);
  if(vot)vot.candidatos.forEach(c => {
    const o = document.createElement('option');
    o.value = c.candidatoId;
    o.textContent = `${c.nombre}${c.partido ? ' — ' + c.partido : ''}`;
    sel.appendChild(o);
  });
}

async function votarAdmin() {
  const votacionId = parseInt(document.getElementById('selVotAdmin').value);
  const candidatoId = parseInt(document.getElementById('selCandAdmin').value);
  if(!votacionId || !candidatoId){
    mostrarAlerta('msgAdmin', 'Selecciona votación y candidato.', 'error');
    return;
  }
  const res  = await fetch('http://localhost:3000/api/votaciones/votar', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ votacionId, candidatoId })
  });
  const data = await res.json();
  if(!res.ok){
    mostrarAlerta('msgAdmin', data.error, 'error');
    return;
  }
  mostrarAlerta('msgAdmin', '¡Voto emitido correctamente!', 'exito');
  cargarResultados();
}

function switchTab(nombre) {
  document.getElementById('tab-resultados').style.display = nombre === 'resultados' ? 'block' : 'none';
  document.getElementById('tab-votar').style.display = nombre === 'votar' ? 'block' : 'none';
}

initDashboard();
