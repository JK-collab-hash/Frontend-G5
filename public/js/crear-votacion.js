let catalogos = {};
let candidatosDisponibles = [];

async function initCrearVotacion() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if (s.tipo !== 'admin') {
    location.href = '/login-usuario';
    return;
  }
  catalogos = await fetch('http://localhost:3000/api/catalogos', {
    credentials: 'include'
  }).then(r => r.json());
  llenarSelect('selDistrito', catalogos.distritos, 'distritoId');
  llenarSelect('selProvincia', catalogos.provincias, 'provinciaId');
  llenarSelect('selDepartamento', catalogos.departamentos, 'departamentoId');
  llenarSelect('selCargo', catalogos.cargos, 'cargoId');
  llenarSelect('selOrganizacion', catalogos.organizaciones, 'organizacionId');

  document.getElementById('selCargo').addEventListener('change', onFiltroCandidatosChange);
  document.getElementById('selOrganizacion').addEventListener('change', onFiltroCandidatosChange);
  document.getElementById('selDistrito').addEventListener('change', onFiltroCandidatosChange);
  document.getElementById('selProvincia').addEventListener('change', onFiltroCandidatosChange);
  document.getElementById('selDepartamento').addEventListener('change', onFiltroCandidatosChange);

  cargarCandidatos();
}

async function cargarCandidatos() {
  const tipo = document.getElementById('tipo').value;
  if (tipo === 'referendum') {
    return;
  }

  const cargoId = document.getElementById('selCargo').value;
  const organizacionId = document.getElementById('selOrganizacion').value;
  const distritoId = document.getElementById('selDistrito').value;
  const provinciaId = document.getElementById('selProvincia').value;
  const departamentoId = document.getElementById('selDepartamento').value;

  const params = new URLSearchParams();
  if (tipo) {
    params.set('tipo', tipo);
  }
  if (cargoId && tipo === 'institucional') {
    params.set('cargoId', cargoId);
  }
  if (organizacionId && tipo === 'partido') {
    params.set('organizacionId', organizacionId);
  }
  if (distritoId && tipo === 'distrital') {
    params.set('distritoId', distritoId);
  }
  if (provinciaId && tipo === 'provincial') {
    params.set('provinciaId', provinciaId);
  }
  if (departamentoId && tipo === 'departamental') {
    params.set('departamentoId', departamentoId);
  }

  candidatosDisponibles = await fetch(`http://localhost:3000/api/candidatos?${params.toString()}`, {
    credentials: 'include'
  }).then(r => r.json());
  renderCandidatos();
}

function renderCandidatos() {
  const grid = document.getElementById('candGrid');
  if (!candidatosDisponibles.length) {
    grid.innerHTML = '<p class="text-muted">No hay candidatos que postulen a lo seleccionado.</p>';
    return;
  }
  grid.innerHTML = candidatosDisponibles.map(c => `<div><input type="checkbox" id="c${c.candidatoId}" value="${c.candidatoId}" onchange="quitarErrorGrid()">
    <label for="c${c.candidatoId}"> ${c.nombre}${c.cargo ? ' — postula a ' + c.cargo : ''}${c.organizacionPostula ? ' (' + c.organizacionPostula + ')' : ''}</label>
    </div>`).join('');
}

function quitarErrorGrid() {
  document.getElementById('candGrid').classList.remove('is-invalid');
}

function onTipoChange() {
  const tipo = document.getElementById('tipo').value;
  document.getElementById('grpDistrito').style.display = tipo === 'distrital' ? 'block' : 'none';
  document.getElementById('grpProvincia').style.display = tipo === 'provincial' ? 'block' : 'none';
  document.getElementById('grpDepartamento').style.display = tipo === 'departamental' ? 'block' : 'none';
  document.getElementById('grpCargo').style.display = tipo === 'institucional' ? 'block' : 'none';
  document.getElementById('grpOrganizacion').style.display = tipo === 'partido' ? 'block' : 'none';

  const esReferendum = tipo === 'referendum';
  document.getElementById('bloque-candidatos').style.display = esReferendum ? 'none' : 'block';
  document.getElementById('bloque-norma').style.display = esReferendum ? 'block' : 'none';

  if (esReferendum) {
    quitarErrorGrid();
  } else {
    quitarError(document.getElementById('normaTitulo'));
  }

  cargarCandidatos();
}

function onFiltroCandidatosChange() {
  cargarCandidatos();
}

function fijarFechaMinima() {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  const min = ahora.toISOString().slice(0, 16);
  document.getElementById('fecha_ini').min = min;
  document.getElementById('fecha_fin').min = min;
}

fijarFechaMinima();

document.getElementById('fecha_ini').addEventListener('change', function () {
  const finInput = document.getElementById('fecha_fin');
  finInput.min = this.value;
  if (finInput.value && finInput.value < this.value) {
    finInput.value = '';
  }
});

async function crearVotacion() {
  let valido = true;
  const tipo = document.getElementById('tipo').value;
  const esReferendum = tipo === 'referendum';

  const tituloEl = document.getElementById('titulo');
  if (!tituloEl.value.trim()) {
    marcarError(tituloEl);
    valido = false;
  } else {
    quitarError(tituloEl);
  }

  const iniEl = document.getElementById('fecha_ini');
  const finEl = document.getElementById('fecha_fin');
  if (!iniEl.value) {
    marcarError(iniEl);
    valido = false;
  } else {
    quitarError(iniEl);
  }

  if (!finEl.value) {
    marcarError(finEl);
    valido = false;
  } else if (iniEl.value && finEl.value <= iniEl.value) {
    marcarError(finEl);
    valido = false;
  } else {
    quitarError(finEl);
  }

  if (tipo === 'distrital') {
    const distritoEl = document.getElementById('selDistrito');
    if (!distritoEl.value) {
      marcarError(distritoEl);
      valido = false;
    } else {
      quitarError(distritoEl);
    }
  }
  if (tipo === 'provincial') {
    const provinciaEl = document.getElementById('selProvincia');
    if (!provinciaEl.value) {
      marcarError(provinciaEl);
      valido = false;
    } else {
      quitarError(provinciaEl);
    }
  }
  if (tipo === 'departamental') {
    const departamentoEl = document.getElementById('selDepartamento');
    if (!departamentoEl.value) {
      marcarError(departamentoEl);
      valido = false;
    } else {
      quitarError(departamentoEl);
    }
  }
  if (tipo === 'institucional') {
    const cargoEl = document.getElementById('selCargo');
    if (!cargoEl.value) {
      marcarError(cargoEl);
      valido = false;
    } else {
      quitarError(cargoEl);
    }
  }
  if (tipo === 'partido') {
    const orgEl = document.getElementById('selOrganizacion');
    if (!orgEl.value) {
      marcarError(orgEl);
      valido = false;
    } else {
      quitarError(orgEl);
    }
  }

  let candidatos = [];
  let normaTitulo = '';
  let normaDescripcion = '';

  if (esReferendum) {
    const normaTituloEl = document.getElementById('normaTitulo');
    normaTitulo = normaTituloEl.value.trim();
    normaDescripcion = document.getElementById('normaDescripcion').value.trim();
    if (!normaTitulo) {
      marcarError(normaTituloEl);
      valido = false;
    } else {
      quitarError(normaTituloEl);
    }
  } else {
    candidatos = [...document.querySelectorAll('#candGrid input:checked')].map(i => parseInt(i.value));
    if (candidatos.length < 2) {
      document.getElementById('candGrid').classList.add('is-invalid');
      valido = false;
    } else {
      quitarErrorGrid();
    }
  }

  if (!valido) {
    mostrarAlerta('alerta', 'Corrige los campos marcados en rojo.', 'error');
    return;
  }

  const body = {
    titulo: tituloEl.value.trim(),
    tipo,
    fecha_ini: iniEl.value,
    fecha_fin: finEl.value
  };
  if (tipo === 'distrital') {
    body.distritoId = document.getElementById('selDistrito').value || null;
  }
  if (tipo === 'provincial') {
    body.provinciaId = document.getElementById('selProvincia').value || null;
  }
  if (tipo === 'departamental') {
    body.departamentoId = document.getElementById('selDepartamento').value || null;
  }
  if (tipo === 'institucional') {
    body.cargoId = document.getElementById('selCargo').value || null;
  }
  if (tipo === 'partido') {
    body.organizacionId = document.getElementById('selOrganizacion').value || null;
  }
  if (esReferendum) {
    body.norma = { titulo: normaTitulo, descripcion: normaDescripcion || null };
  } else {
    body.candidatos = candidatos;
  }

  try {
    const res = await fetch('http://localhost:3000/api/votaciones/crear', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta', data.error || 'Error al crear la votación.', 'error');
      return;
    }
    mostrarAlerta('alerta', 'Votación creada. Redirigiendo...', 'exito');
    setTimeout(() => location.href = '/dashboard', 1400);
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}
initCrearVotacion();