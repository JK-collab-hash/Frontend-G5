let votacionesData = [];
let usuarioSesion = null;

async function initDashboard() {
  const s = await Api.getSession();
  if (s.tipo !== 'admin') {
    location.href = '/login-usuario';
    return;
  }
  usuarioSesion = s.data;
  document.getElementById('wNombre').textContent = usuarioSesion.nombre || `DNI: ${usuarioSesion.DNI}`;
  await cargarDetalleUsuario();
  cargarResultados();
  cargarVotacionesAdmin();
  cargarRegistro();
}

async function cargarDetalleUsuario() {
  const partesDetalle = [];

  if (usuarioSesion.cargo) {
    partesDetalle.push(usuarioSesion.cargo);
  }

  try {
    const organizaciones = await Api.listarOrganizacionesDeUsuario(usuarioSesion.DNI);

    if (Array.isArray(organizaciones)) {
      organizaciones.forEach(o => {
        partesDetalle.push(o.rolInterno ? `${o.nombre} (${o.rolInterno})` : o.nombre);
      });
    }
  } catch (e) {
  }

  if (usuarioSesion.distrito) {
    partesDetalle.push(usuarioSesion.distrito);
  }

  document.getElementById('wDetalle').textContent =
    partesDetalle.length ? partesDetalle.join(' · ') : 'Sin clasificación especial';
}

async function cargarResultados() {
  try {
    const data = await Api.getResultados();
    renderResultados(data);
  } catch (e) {
    document.getElementById('resultadosContainer').innerHTML = '<p>Error al cargar.</p>';
  }
}

function renderResultados(data) {
  const container = document.getElementById('resultadosContainer');
  const filasCandidatos = (data && data.candidatos) || [];
  const filasReferendums = (data && data.referendums) || [];

  if (filasCandidatos.length === 0 && filasReferendums.length === 0) {
    container.innerHTML = '<p>No hay votaciones registradas aún.</p>';
    document.getElementById('statVotaciones').textContent = 0;
    return;
  }

  const grouped = {};

  filasCandidatos.forEach(r => {
    if (!grouped[r.votacionId]) {
      grouped[r.votacionId] = {
        titulo: r.titulo, tipo: r.tipo, activa: r.activa, fecha_fin: r.fecha_fin, cerradaDefinitiva: !!r.fechaCierreReal,
        candidatos: [], referendum: null
      };
    }
    if (r.candidato) {
      grouped[r.votacionId].candidatos.push({ nombre: r.candidato, organizacion: r.organizacion, votos: r.total_votos });
    }
  });

  filasReferendums.forEach(r => {
    if (!grouped[r.votacionId]) {
      grouped[r.votacionId] = {
        titulo: r.titulo, tipo: r.tipo, activa: r.activa, fecha_fin: r.fecha_fin, cerradaDefinitiva: !!r.fechaCierreReal,
        candidatos: [], referendum: { norma: r.norma, aFavor: 0, enContra: 0 }
      };
    }
    if (!grouped[r.votacionId].referendum) {
      grouped[r.votacionId].referendum = { norma: r.norma, aFavor: 0, enContra: 0 };
    }
    if (r.opcion === 'a_favor') {
      grouped[r.votacionId].referendum.aFavor = r.total_votos;
    } else if (r.opcion === 'en_contra') {
      grouped[r.votacionId].referendum.enContra = r.total_votos;
    }
  });

  let html = '';
  Object.entries(grouped).forEach(([id, v]) => {
    const plazoVencido = v.fecha_fin && new Date(v.fecha_fin) <= new Date();

    let btnEstado;
    if (v.cerradaDefinitiva) {
      btnEstado = `<button id="btn-toggle-${id}" class="btn btn-sm btn-secondary" disabled title="Esta votación ya fue cerrada definitivamente">
           Cerrada definitivamente
         </button>`;
    } else if (plazoVencido) {
      btnEstado = `<button id="btn-toggle-${id}" class="btn btn-sm btn-secondary" disabled title="El plazo de esta votación ya finalizó">
           Finalizada (plazo vencido)
         </button>`;
    } else {
      btnEstado = `<button
            id="btn-toggle-${id}"
            class="btn btn-sm ${v.activa ? 'btn-success' : 'btn-secondary'}"
            onclick="toggleVotacion(${id})">
            ${v.activa ? 'Activa' : 'Finalizada'}
          </button>`;
    }

    const btnCerrar = v.cerradaDefinitiva
      ? `<button id="btn-cerrar-${id}" class="btn btn-sm btn-outline-secondary" disabled>Ya cerrada</button>`
      : `<button
            id="btn-cerrar-${id}"
            class="btn btn-sm btn-outline-danger"
            onclick="cerrarVotacion(${id})">
            Cerrar ${v.tipo === 'referendum' ? '' : 'y calcular ganador'}
          </button>`;

    html += `
      <div class="mb-4">
        <div class="d-flex align-items-center gap-3 mb-2">
          <h3 class="mb-0">${v.titulo} (${v.tipo})</h3>
          ${btnEstado}
          ${btnCerrar}
        </div>
        <div id="msg-cierre-${id}" class="mb-2"></div>`;

    if (v.tipo === 'referendum') {
      if (v.referendum && v.referendum.norma) {
        html += `<p class="fw-semibold mb-1">${v.referendum.norma}</p>`;
      }
      html += `<p>A favor: <strong>${v.referendum ? v.referendum.aFavor : 0} voto(s)</strong></p>`;
      html += `<p>En contra: <strong>${v.referendum ? v.referendum.enContra : 0} voto(s)</strong></p>`;
    } else if (v.candidatos.length === 0) {
      html += `<p class="text-muted">Sin candidatos asignados a esta votación todavía.</p>`;
    } else {
      v.candidatos.forEach(c => {
        html += `<p>${c.nombre}${c.organizacion ? ' — ' + c.organizacion : ''}: <strong>${c.votos} voto(s)</strong></p>`;
      });
    }
    html += '</div>';
  });

  const activasCount = Object.values(grouped).filter(v => {
    const plazoVencido = v.fecha_fin && new Date(v.fecha_fin) <= new Date();
    return v.activa && !v.cerradaDefinitiva && !plazoVencido;
  }).length;
  document.getElementById('statVotaciones').textContent = activasCount;
  container.innerHTML = html;
}

async function toggleVotacion(votacionId) {
  try {
    const data = await Api.toggleVotacion(votacionId);
    const btn = document.getElementById(`btn-toggle-${votacionId}`);
    if (data.activa) {
      btn.className = 'btn btn-sm btn-success';
      btn.textContent = 'Activa';
    } else {
      btn.className = 'btn btn-sm btn-secondary';
      btn.textContent = 'Finalizada';
    }
    cargarRegistro();
  } catch (e) {
    alert(e.message || 'Error');
  }
}

async function cerrarVotacion(votacionId) {
  if (!confirm('¿Cerrar esta votación? Esta acción no se puede deshacer.')) {
    return;
  }
  try {
    const data = await Api.cerrarVotacion(votacionId);
    if (data.empate) {
      mostrarAlerta(`msg-cierre-${votacionId}`, data.mensaje, 'error');
    } else {
      mostrarAlerta(`msg-cierre-${votacionId}`, data.mensaje, 'exito');
    }
    cargarResultados();
    cargarRegistro();
  } catch (e) {
    mostrarAlerta(`msg-cierre-${votacionId}`, e.message || 'Error de conexión.', 'error');
  }
}

async function cargarVotacionesAdmin() {
  const res = await Api.getVotacionesDisponibles();
  votacionesData = Array.isArray(res) ? res : [];
  const sel = document.getElementById('selVotAdmin');
  if (!sel) {
    return;
  }
  votacionesData.forEach(v => {
    const o = document.createElement('option');
    o.value = v.votacionId;
    o.textContent = v.titulo;
    sel.appendChild(o);
  });
}

function actualizarAccionVotoAdmin() {
  const vid = parseInt(document.getElementById('selVotAdmin').value);
  const vot = votacionesData.find(v => v.votacionId === vid);
  const bloqueCandidato = document.getElementById('bloque-candidato-admin');
  const bloqueReferendum = document.getElementById('bloque-referendum-admin');

  if (!vot) {
    bloqueCandidato.style.display = 'block';
    bloqueReferendum.style.display = 'none';
    document.getElementById('selCandAdmin').innerHTML = '<option value="">Selecciona votación</option>';
    return;
  }

  if (vot.tipo === 'referendum') {
    bloqueCandidato.style.display = 'none';
    bloqueReferendum.style.display = 'block';
    document.getElementById('normaInfoAdmin').textContent =
      vot.norma ? vot.norma.titulo : 'Esta votación no tiene una norma asociada.';
    return;
  }

  bloqueCandidato.style.display = 'block';
  bloqueReferendum.style.display = 'none';
  const sel = document.getElementById('selCandAdmin');
  sel.innerHTML = '<option value="">— Elige un candidato —</option>';
  vot.candidatos.forEach(c => {
    const o = document.createElement('option');
    o.value = c.candidatoId;
    o.textContent = `${c.nombre}${c.organizacion ? ' — ' + c.organizacion : ''}`;
    sel.appendChild(o);
  });
}

async function votarAdmin() {
  const votacionId = parseInt(document.getElementById('selVotAdmin').value);
  const candidatoId = parseInt(document.getElementById('selCandAdmin').value);
  if (!votacionId || !candidatoId) {
    mostrarAlerta('msgAdmin', 'Selecciona votación y candidato.', 'error');
    return;
  }
  try {
    await Api.registrarVoto({ votacionId, candidatoId });
    mostrarAlerta('msgAdmin', '¡Voto emitido correctamente!', 'exito');
    cargarResultados();
  } catch (e) {
    mostrarAlerta('msgAdmin', e.message, 'error');
  }
}

async function votarReferendumAdmin(opcion) {
  const votacionId = parseInt(document.getElementById('selVotAdmin').value);
  if (!votacionId) {
    mostrarAlerta('msgAdmin', 'Selecciona una votación.', 'error');
    return;
  }
  try {
    await Api.registrarVoto({ votacionId, opcion });
    mostrarAlerta('msgAdmin', '¡Voto emitido correctamente!', 'exito');
    cargarResultados();
  } catch (e) {
    mostrarAlerta('msgAdmin', e.message || 'Error al votar.', 'error');
  }
}

function switchTab(nombre, btn) {
  document.getElementById('tab-resultados').style.display = nombre === 'resultados' ? 'block' : 'none';
  document.getElementById('tab-votar').style.display = nombre === 'votar' ? 'block' : 'none';
  document.getElementById('tab-registro').style.display = nombre === 'registro' ? 'block' : 'none';
  document.querySelectorAll('.tab-barra button').forEach(b => b.classList.remove('activo'));
  if (btn) {
    btn.classList.add('activo');
  }
}

function formatearFecha(f) {
  if (!f) {
    return '—';
  }
  const d = new Date(f);
  return d.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

async function cargarRegistro() {
  try {
    const data = await fetch('http://localhost:3000/api/votaciones/registro', {
      credentials: 'include'
    }).then(r => r.json());
    renderRegistro(Array.isArray(data) ? data : []);
  } catch (e) {
    document.getElementById('registroContainer').innerHTML = '<p>Error al cargar el registro.</p>';
  }
}

function renderRegistro(votaciones) {
  const container = document.getElementById('registroContainer');

  if (votaciones.length === 0) {
    container.innerHTML = '<p>No hay votaciones registradas aún.</p>';
    return;
  }

  const badgeEstado = {
    'En curso': 'bg-success',
    'Finalizada': 'bg-secondary',
    'Cerrada anticipadamente': 'bg-warning text-dark'
  };

  let html = '<div class="table-responsive"><table class="table align-middle">';
  html += `<thead>
  <tr>
    <th>Votación</th>
    <th>Tipo</th>
    <th>Inicio</th>
    <th>Fin (programado)</th>
    <th>Cierre real</th>
    <th>Estado</th>
    <th>Resultado</th></tr>
    </thead><tbody>`;

  votaciones.forEach(v => {
    const clase = badgeEstado[v.estado] || 'bg-secondary';
    html += `<tr>
    <td>${v.titulo}</td>
    <td>${v.tipo}</td>
    <td>${formatearFecha(v.fecha_ini)}</td>
    <td>${formatearFecha(v.fecha_fin)}</td>
    <td>${v.fechaCierreReal ? formatearFecha(v.fechaCierreReal) : '—'}</td>
    <td><span class="badge ${clase}">${v.estado}</span></td>
    <td>${v.resultado ? v.resultado : (v.estado === 'En curso' ? '—' : 'Sin votos')}</td></tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

initDashboard();