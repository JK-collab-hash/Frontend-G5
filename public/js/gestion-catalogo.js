let catalogosBase = { departamentos: [], provincias: [] };
let cacheOrganizaciones = {};
let cacheCargos = {};
let cacheDepartamentos = {};
let cacheProvincias = {};
let cacheDistritos = {};

async function initGestionCatalogos() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if (s.tipo !== 'admin') {
    location.href = '/login-usuario';
    return;
  }
  await cargarCatalogosBase();
  cargarOrganizaciones();
  cargarCargos();
  cargarDepartamentos();
  cargarProvincias();
  cargarDistritos();
}

async function cargarCatalogosBase() {
  try {
    const res = await fetch('http://localhost:3000/api/catalogos', { credentials: 'include' });
    if (!res.ok) 
      return;
    const data = await res.json();
    catalogosBase.departamentos = data.departamentos || [];
    catalogosBase.provincias = data.provincias || [];
    llenarSelectCatalogo(document.getElementById('new-prov-departamento'), catalogosBase.departamentos, 'departamentoId', 'nombre', 'Selecciona');
    llenarSelectCatalogo(document.getElementById('new-dist-departamento'), catalogosBase.departamentos, 'departamentoId', 'nombre', 'Selecciona');
  } catch (err) {
    console.error('Error de red al cargar catálogos base:', err);
  }
}

function llenarSelectCatalogo(select, items, valueKey, labelKey, placeholder) {
  select.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') + items.map(i => `<option value="${i[valueKey]}">${i[labelKey]}</option>`).join('');
}

function switchTabCatalogos(nombre, btn) {
  ['organizaciones', 'cargos', 'departamentos', 'provincias', 'distritos'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === nombre ? 'block' : 'none';
  });
  document.querySelectorAll('.tab-barra button').forEach(b => b.classList.remove('activo'));
  if (btn) {
    btn.classList.add('activo');
  }
}

function badgeUso(...pares) {
  const partes = pares.filter(([n]) => n > 0).map(([n, etq]) => `${n} ${etq}`);
  if (partes.length === 0) {
    return '<span class="gc-count gc-count--cero">sin uso</span>';
  }
  return `<span class="gc-count">${partes.join(', ')}</span>`;
}

async function cargarOrganizaciones() {
  const tbody = document.getElementById('tbody-organizaciones');
  try {
    const data = await fetch('http://localhost:3000/api/organizaciones', { credentials: 'include' }).then(r => r.json());
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-3">No hay organizaciones registradas.</td></tr>';
      return;
    }
    cacheOrganizaciones = {};
    data.forEach(o => cacheOrganizaciones[o.organizacionId] = o);

    tbody.innerHTML = data.map(o => `
      <tr>
        <td class="fw-semibold">${o.nombre}</td>
        <td><span class="gc-badge">${o.tipo}</span></td>
        <td>${badgeUso([o.totalMiembros, 'miembro(s)'], [o.totalCandidatos, 'candidato(s)'])}</td>
        <td class="gc-col-acciones">
          <button class="btn btn-sm btn-outline-danger" onclick="abrirModalEditarCatalogo('organizaciones', ${o.organizacionId})">Editar</button>
        </td>
      </tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger text-center py-3">Error al cargar organizaciones.</td></tr>';
  }
}

async function crearOrganizacionCatalogo() {
  const nombreEl = document.getElementById('new-org-nombre');
  const nombre = nombreEl.value.trim();
  const tipo = document.getElementById('new-org-tipo').value;

  if(!nombre){
    marcarError(nombreEl);
    mostrarAlerta('alerta-organizaciones', 'El nombre de la organización es obligatorio.', 'error');
    return;
  }
  quitarError(nombreEl);

  try{
    const res = await fetch('http://localhost:3000/api/organizaciones', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tipo })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta-organizaciones', data.error || 'Error al crear la organización.', 'error');
      return;
    }
    mostrarAlerta('alerta-organizaciones', 'Organización creada correctamente.', 'exito');
    nombreEl.value = '';
    document.getElementById('new-org-tipo').value = 'partido';
    cargarOrganizaciones();
  }catch{
    mostrarAlerta('alerta-organizaciones', 'Error de conexión.', 'error');
  }
}

async function cargarCargos() {
  const tbody = document.getElementById('tbody-cargos');
  try {
    const data = await fetch('http://localhost:3000/api/cargos', { credentials: 'include' }).then(r => r.json());
    if (!Array.isArray(data) || data.length === 0) {tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-3">No hay cargos registrados.</td></tr>';
      return;
    }
    cacheCargos = {};
    data.forEach(c => cacheCargos[c.cargoId] = c);

    tbody.innerHTML = data.map(c => `<tr><td class="fw-semibold">${c.nombre}</td><td><span class="gc-badge">${c.tipo}</span></td>
      <td>${badgeUso([c.enUsoPersonas, 'persona(s)'], [c.enUsoVotaciones, 'votación(es)'])}</td>
      <td class="gc-col-acciones">
      <button class="btn btn-sm btn-outline-danger" onclick="abrirModalEditarCatalogo('cargos', ${c.cargoId})">Editar</button>
      </td>
      </tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger text-center py-3">Error al cargar cargos.</td></tr>';
  }
}

async function crearCargoCatalogo() {
  const nombreEl = document.getElementById('new-cargo-nombre');
  const nombre = nombreEl.value.trim();
  const tipo = document.getElementById('new-cargo-tipo').value;

  if (!nombre) {
    marcarError(nombreEl);
    mostrarAlerta('alerta-cargos', 'El nombre del cargo es obligatorio.', 'error');
    return;
  }
  quitarError(nombreEl);

  try {
    const res = await fetch('http://localhost:3000/api/cargos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tipo })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta-cargos', data.error || 'Error al crear el cargo.', 'error');
      return;
    }
    mostrarAlerta('alerta-cargos', 'Cargo creado correctamente.', 'exito');
    nombreEl.value = '';
    document.getElementById('new-cargo-tipo').value = 'nacional';
    cargarCargos();
  } catch {
    mostrarAlerta('alerta-cargos', 'Error de conexión.', 'error');
  }
}

async function cargarDepartamentos() {
  const tbody = document.getElementById('tbody-departamentos');
  try {
    const data = await fetch('http://localhost:3000/api/departamentos', { credentials: 'include' }).then(r => r.json());
    if (!Array.isArray(data) || data.length === 0) {tbody.innerHTML = '<tr><td colspan="3" class="text-muted text-center py-3">No hay departamentos registrados.</td></tr>';
      return;
    }
    cacheDepartamentos = {};
    data.forEach(d => cacheDepartamentos[d.departamentoId] = d);

    tbody.innerHTML = data.map(d => `<tr><td class="fw-semibold">${d.nombre}</td><td>${badgeUso([d.totalProvincias, 'provincia(s)'])}</td>
    <td class="gc-col-acciones">
    <button class="btn btn-sm btn-outline-danger" onclick="abrirModalEditarCatalogo('departamentos', ${d.departamentoId})">Editar</button>
    </td>
    </tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center py-3">Error al cargar departamentos.</td></tr>';
  }
}

async function crearDepartamentoCatalogo() {
  const nombreEl = document.getElementById('new-dep-nombre');
  const nombre = nombreEl.value.trim();

  if (!nombre) {
    marcarError(nombreEl);
    mostrarAlerta('alerta-departamentos', 'El nombre del departamento es obligatorio.', 'error');
    return;
  }
  quitarError(nombreEl);

  try {
    const res = await fetch('http://localhost:3000/api/departamentos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta-departamentos', data.error || 'Error al crear el departamento.', 'error');
      return;
    }
    mostrarAlerta('alerta-departamentos', 'Departamento creado correctamente.', 'exito');
    nombreEl.value = '';
    await cargarCatalogosBase();
    cargarDepartamentos();
  } catch {
    mostrarAlerta('alerta-departamentos', 'Error de conexión.', 'error');
  }
}

async function cargarProvincias() {
  const tbody = document.getElementById('tbody-provincias');
  try {
    const data = await fetch('http://localhost:3000/api/provincias', { credentials: 'include' }).then(r => r.json());
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-3">No hay provincias registradas.</td></tr>';
      return;
    }
    cacheProvincias = {};
    data.forEach(p => cacheProvincias[p.provinciaId] = p);

    tbody.innerHTML = data.map(p => `<tr><td class="fw-semibold">${p.nombre}</td><td>${p.departamento}</td><td>${badgeUso([p.totalDistritos, 'distrito(s)'])}</td>
    <td class="gc-col-acciones">
    <button class="btn btn-sm btn-outline-danger" onclick="abrirModalEditarCatalogo('provincias', ${p.provinciaId})">Editar</button>
    </td></tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger text-center py-3">Error al cargar provincias.</td></tr>';
  }
}

async function crearProvinciaCatalogo() {
  const nombreEl = document.getElementById('new-prov-nombre');
  const nombre = nombreEl.value.trim();
  const departamentoId = document.getElementById('new-prov-departamento').value;

  if (!nombre) {
    marcarError(nombreEl);
    mostrarAlerta('alerta-provincias', 'El nombre de la provincia es obligatorio.', 'error');
    return;
  }
  if (!departamentoId) {
    mostrarAlerta('alerta-provincias', 'Selecciona un departamento.', 'error');
    return;
  }
  quitarError(nombreEl);

  try {
    const res = await fetch('http://localhost:3000/api/provincias', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, departamentoId })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta-provincias', data.error || 'Error al crear la provincia.', 'error');
      return;
    }
    mostrarAlerta('alerta-provincias', 'Provincia creada correctamente.', 'exito');
    nombreEl.value = '';
    await cargarCatalogosBase();
    cargarProvincias();
  } catch {
    mostrarAlerta('alerta-provincias', 'Error de conexión.', 'error');
  }
}

function onDepartamentoChangeNuevoDistrito() {
  const departamentoId = document.getElementById('new-dist-departamento').value;
  const selProvincia = document.getElementById('new-dist-provincia');

  if (!departamentoId) {
    selProvincia.disabled = true;
    llenarSelectCatalogo(selProvincia, [], 'provinciaId', 'nombre', 'Selecciona un departamento primero');
    return;
  }
  const provincias = catalogosBase.provincias.filter(p => Number(p.departamentoId) === Number(departamentoId));
  selProvincia.disabled = false;
  llenarSelectCatalogo(selProvincia, provincias, 'provinciaId', 'nombre', 'Selecciona');
}

async function cargarDistritos() {
  const tbody = document.getElementById('tbody-distritos');
  try {
    const data = await fetch('http://localhost:3000/api/distritos', { credentials: 'include' }).then(r => r.json());
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center py-3">No hay distritos registrados.</td></tr>';
      return;
    }
    cacheDistritos = {};
    data.forEach(d => cacheDistritos[d.distritoId] = d);

    tbody.innerHTML = data.map(d => `<tr><td class="fw-semibold">${d.nombre}</td><td>${d.provincia}</td><td>${d.departamento}</td><td>${badgeUso([d.enUsoPersonas, 'persona(s)'])}</td>
    <td class="gc-col-acciones"><button class="btn btn-sm btn-outline-danger" onclick="abrirModalEditarCatalogo('distritos', ${d.distritoId})">Editar</button></td></tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center py-3">Error al cargar distritos.</td></tr>';
  }
}

async function crearDistritoCatalogo() {
  const nombreEl = document.getElementById('new-dist-nombre');
  const nombre = nombreEl.value.trim();
  const provinciaId = document.getElementById('new-dist-provincia').value;

  if (!nombre) {
    marcarError(nombreEl);
    mostrarAlerta('alerta-distritos', 'El nombre del distrito es obligatorio.', 'error');
    return;
  }
  if (!provinciaId) {
    mostrarAlerta('alerta-distritos', 'Selecciona departamento y provincia.', 'error');
    return;
  }
  quitarError(nombreEl);

  try {
    const res = await fetch('http://localhost:3000/api/distritos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, provinciaId })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta-distritos', data.error || 'Error al crear el distrito.', 'error');
      return;
    }
    mostrarAlerta('alerta-distritos', 'Distrito creado correctamente.', 'exito');
    nombreEl.value = '';
    document.getElementById('new-dist-provincia').value = '';
    cargarDistritos();
  } catch {
    mostrarAlerta('alerta-distritos', 'Error de conexión.', 'error');
  }
}

function filtrarTabla(inputId, tbodyId) {
  const q = document.getElementById(inputId).value.toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

const TIPOS_POR_CATALOGO = {
  organizaciones: ['partido', 'institucion', 'empresa', 'otro'],
  cargos: ['nacional', 'distrital', 'provincial', 'departamental', 'institucional', 'partido']
};

const TITULOS_POR_CATALOGO = {
  organizaciones: 'organización',
  cargos: 'cargo',
  departamentos: 'departamento',
  provincias: 'provincia',
  distritos: 'distrito'
};

const CACHE_POR_CATALOGO = {
  organizaciones: () => cacheOrganizaciones,
  cargos: () => cacheCargos,
  departamentos: () => cacheDepartamentos,
  provincias: () => cacheProvincias,
  distritos: () => cacheDistritos
};

const ID_KEY_POR_CATALOGO = {
  organizaciones: 'organizacionId',
  cargos: 'cargoId',
  departamentos: 'departamentoId',
  provincias: 'provinciaId',
  distritos: 'distritoId'
};

function abrirModalEditarCatalogo(catalogo, id) {
  const item = CACHE_POR_CATALOGO[catalogo]()[id];
  if (!item) 
    return;

  document.getElementById('ec-id').value = id;
  document.getElementById('ec-catalogo').value = catalogo;
  document.getElementById('ec-titulo').textContent = `Editar ${TITULOS_POR_CATALOGO[catalogo]}`;
  document.getElementById('ec-alerta').innerHTML = '';

  const nombreEl = document.getElementById('ec-nombre');
  nombreEl.value = item.nombre;
  quitarError(nombreEl);
  
  const tipoWrap = document.getElementById('ec-tipo-wrap');
  const tipoSel = document.getElementById('ec-tipo');
  if (TIPOS_POR_CATALOGO[catalogo]) {
    tipoWrap.style.display = '';
    tipoSel.innerHTML = TIPOS_POR_CATALOGO[catalogo].map(t => `<option value="${t}">${t}</option>`).join('');
    tipoSel.value = item.tipo;
  } else {
    tipoWrap.style.display = 'none';
  }
  
  const depWrap = document.getElementById('ec-departamento-wrap');
  const depSel = document.getElementById('ec-departamento');
  const provWrap = document.getElementById('ec-provincia-wrap');
  const provSel = document.getElementById('ec-provincia');

  if (catalogo === 'provincias') {
    depWrap.style.display = '';
    provWrap.style.display = 'none';
    llenarSelectCatalogo(depSel, catalogosBase.departamentos, 'departamentoId', 'nombre', null);
    depSel.value = item.departamentoId;
  } else if (catalogo === 'distritos') {
    depWrap.style.display = '';
    provWrap.style.display = '';
    llenarSelectCatalogo(depSel, catalogosBase.departamentos, 'departamentoId', 'nombre', null);
    const provinciaActual = cacheProvincias[item.provinciaId];
    depSel.value = provinciaActual ? provinciaActual.departamentoId : '';
    onDepartamentoChangeCatalogo();
    provSel.value = item.provinciaId;
  } else {
    depWrap.style.display = 'none';
    provWrap.style.display = 'none';
  }
  
  const usoEl = document.getElementById('ec-uso');
  if (catalogo === 'organizaciones') {
    usoEl.innerHTML = badgeUso([item.totalMiembros, 'miembro(s)'], [item.totalCandidatos, 'candidato(s)']);
  } else if (catalogo === 'cargos') {
    usoEl.innerHTML = badgeUso([item.enUsoPersonas, 'persona(s)'], [item.enUsoVotaciones, 'votación(es)']);
  } else if (catalogo === 'departamentos') {
    usoEl.innerHTML = badgeUso([item.totalProvincias, 'provincia(s)']);
  } else if (catalogo === 'provincias') {
    usoEl.innerHTML = badgeUso([item.totalDistritos, 'distrito(s)']);
  } else if (catalogo === 'distritos') {
    usoEl.innerHTML = badgeUso([item.enUsoPersonas, 'persona(s)']);
  }

  new bootstrap.Modal(document.getElementById('modalEditarCatalogo')).show();
}

function onDepartamentoChangeCatalogo() {
  const catalogo = document.getElementById('ec-catalogo').value;
  if (catalogo !== 'distritos') 
    return;

  const departamentoId = document.getElementById('ec-departamento').value;
  const provSel = document.getElementById('ec-provincia');
  if (!departamentoId) {
    llenarSelectCatalogo(provSel, [], 'provinciaId', 'nombre', 'Selecciona un departamento primero');
    return;
  }
  const provincias = catalogosBase.provincias.filter(p => Number(p.departamentoId) === Number(departamentoId));
  llenarSelectCatalogo(provSel, provincias, 'provinciaId', 'nombre', null);
}

function endpointCatalogo(catalogo, id) {
  return `http://localhost:3000/api/${catalogo}/${id}`;
}

async function guardarEdicionCatalogo() {
  const catalogo = document.getElementById('ec-catalogo').value;
  const id = document.getElementById('ec-id').value;
  const nombreEl = document.getElementById('ec-nombre');
  const nombre = nombreEl.value.trim();
  const alertaEl = document.getElementById('ec-alerta');
  alertaEl.innerHTML = '';

  if (!nombre) {
    marcarError(nombreEl);
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">El nombre es obligatorio.</div>';
    return;
  }
  quitarError(nombreEl);

  const body = { nombre };
  if (TIPOS_POR_CATALOGO[catalogo]) {
    body.tipo = document.getElementById('ec-tipo').value;
  }
  if (catalogo === 'provincias') {
    const departamentoId = document.getElementById('ec-departamento').value;
    if (!departamentoId) {
      alertaEl.innerHTML = '<div class="alert alert-danger py-2">Selecciona un departamento.</div>';
      return;
    }
    body.departamentoId = departamentoId;
  }
  if (catalogo === 'distritos') {
    const provinciaId = document.getElementById('ec-provincia').value;
    if (!provinciaId) {
      alertaEl.innerHTML = '<div class="alert alert-danger py-2">Selecciona departamento y provincia.</div>';
      return;
    }
    body.provinciaId = provinciaId;
  }

  try {
    const res = await fetch(endpointCatalogo(catalogo, id), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      alertaEl.innerHTML = `<div class="alert alert-danger py-2">${data.error || 'No se pudo guardar.'}</div>`;
      return;
    }
    bootstrap.Modal.getInstance(document.getElementById('modalEditarCatalogo')).hide();
    recargarCatalogo(catalogo);
  } catch {
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">Error de conexión con el servidor.</div>';
  }
}

async function borrarCatalogo() {
  const catalogo = document.getElementById('ec-catalogo').value;
  const id = document.getElementById('ec-id').value;
  const alertaEl = document.getElementById('ec-alerta');

  if (!confirm(`¿Eliminar este ${TITULOS_POR_CATALOGO[catalogo]}? Esta acción no se puede deshacer.`)) return;

  try {
    const res = await fetch(endpointCatalogo(catalogo, id), {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) {
      alertaEl.innerHTML = `<div class="alert alert-danger py-2">${data.error || 'No se pudo eliminar.'}</div>`;
      return;
    }
    bootstrap.Modal.getInstance(document.getElementById('modalEditarCatalogo')).hide();
    recargarCatalogo(catalogo);
    if (catalogo === 'departamentos' || catalogo === 'provincias' || catalogo === 'distritos') {
      await cargarCatalogosBase();
    }
  } catch {
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">Error de conexión con el servidor.</div>';
  }
}

function recargarCatalogo(catalogo) {
  const mapa = {
    organizaciones: cargarOrganizaciones,
    cargos: cargarCargos,
    departamentos: cargarDepartamentos,
    provincias: cargarProvincias,
    distritos: cargarDistritos
  };
  mapa[catalogo]();
  if (catalogo === 'departamentos') {
    cargarProvincias();
  }
  if (catalogo === 'provincias') {
    cargarDistritos();
  }
}

initGestionCatalogos();