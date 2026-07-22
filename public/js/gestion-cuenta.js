let catalogos = { organizaciones: [], distritos: [], cargos: [], departamentos: [], provincias: [] };
let cacheUsuarios = {};
let cacheAdmins = {};
let cacheCandidatos = {};

async function initGestionCuenta() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if(s.tipo !== 'admin'){
    location.href = '/login-usuario';
    return;
  }
  await cargarCatalogos();
  cargarUsuarios();
  cargarAdmins();
  cargarCandidatos();
  cargarSolicitudesContraseña();
  cargarHistorialSolicitudesContraseña();
}

async function cargarCatalogos(){
  try{
    const res = await fetch('http://localhost:3000/api/catalogos', {
      credentials: 'include'
    });
    if(!res.ok){
      console.error('GET /api/catalogos respondió', res.status, await res.text());
      catalogos = {
        organizaciones: [],
        distritos: [],
        cargos: [],
        departamentos: [],
        provincias: []
      };
      return;
    }
    catalogos = await res.json();
    console.log('Catálogos cargados:', catalogos);
  }catch(err){
    console.error('Error de red al cargar catálogos:', err);
    catalogos = {
      organizaciones: [],
      distritos: [],
      cargos: [],
      departamentos: [],
      provincias: []
    };
  }
}

function nombreCompleto(u) {
  return `${u.nombre} ${u.apellidoP} ${u.apellidoM}`;
}

async function cargarUsuarios() {
  const tbody = document.getElementById('tbody-usuarios');
  try{
    const data = await fetch('http://localhost:3000/api/usuarios', {
      credentials: 'include'
    }).then(r => r.json());

    if(!Array.isArray(data) || data.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted text-center py-3">No hay usuarios .</td></tr>';
      return;
    }
    cacheUsuarios = {};
    data.forEach(u => cacheUsuarios[u.DNI] = u);

    tbody.innerHTML = data.map(u => `<tr>
      <td><span class="gc-dni">${u.DNI}</span></td>
      <td>${nombreCompleto(u)}</td>
      <td>${u.cargo ? `<span class="gc-badge">${u.cargo}</span>` : '<span class="text-muted">—</span>'}</td>
      <td>${u.distrito || '<span class="text-muted">—</span>'}</td>
      <td class="gc-orgs">${u.organizaciones || '<span class="text-muted">—</span>'}</td>
      <td><button class="btn btn-sm btn-outline-danger" onclick="abrirModalEditar('${u.DNI}', 'usuario')">Editar</button></td>
      </tr>`).join('');
  }catch(err){
    tbody.innerHTML = '<tr><td colspan="6" class="text-danger text-center py-3">Error al cargar usuarios.</td></tr>';
  }
}

async function cargarAdmins(){
  const tbody = document.getElementById('tbody-admins');
  try{
    const data = await fetch('http://localhost:3000/api/admins', {
      credentials: 'include'
    }).then(r => r.json());

    if(!Array.isArray(data) || data.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted text-center py-3">No hay administradores registrados.</td></tr>';
      return;
    }
    cacheAdmins = {};
    data.forEach(a => cacheAdmins[a.DNI] = a);

    tbody.innerHTML = data.map(a => `<tr>
      <td><span class="gc-dni">${a.DNI}</span></td>
      <td>${nombreCompleto(a)}</td>
      <td>${a.cargo ? `<span class="gc-badge">${a.cargo}</span>` : '<span class="text-muted">—</span>'}</td>
      <td>${a.distrito || '<span class="text-muted">—</span>'}</td>
      <td class="gc-orgs">${a.organizaciones || '<span class="text-muted">—</span>'}</td>
      <td><button class="btn btn-sm btn-outline-danger" onclick="abrirModalEditar('${a.DNI}', 'admin')">Editar</button></td>
      </tr>`).join('');
  }catch(err){
    tbody.innerHTML = '<tr><td colspan="6" class="text-danger text-center py-3">Error al cargar administradores.</td></tr>';
  }
}

async function cargarCandidatos() {
  const tbody = document.getElementById('tbody-candidatos');
  try{
    const data = await fetch('http://localhost:3000/api/candidatos', {
      credentials: 'include'
    }).then(r => r.json());

    if(!Array.isArray(data) || data.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted text-center py-3">No hay candidatos registrados.</td></tr>';
      return;
    }
    cacheCandidatos = {};
    data.forEach(c => cacheCandidatos[c.candidatoId] = c);
    
    const porPersona = {};
    const orden = [];
    data.forEach(c => {
      if (!porPersona[c.DNI]) {
        porPersona[c.DNI] = {
          DNI: c.DNI,
          nombre: c.nombre,
          apellidoP: c.apellidoP,
          apellidoM: c.apellidoM,
          organizaciones: c.organizaciones,
          candidaturas: []
        };
        orden.push(c.DNI);
      }
      porPersona[c.DNI].candidaturas.push(c);
    });

    tbody.innerHTML = orden.map(dni => {
      const p = porPersona[dni];
      const nombreVis = nombreCompleto(p);
      const cargos = p.candidaturas.map(c => `<span class="gc-badge me-1 mb-1 d-inline-block" style="cursor:pointer" onclick="abrirModalEditarCandidatura(${c.candidatoId})" title="Editar esta postulación">${c.cargo} </span>`).join('');
      const postulaCon = p.candidaturas.map(c => c.organizacionPostula ? `<span class="gc-badge gc-badge--org me-1 mb-1 d-inline-block">${c.organizacionPostula}</span>`
      : `<span class="gc-independiente me-1 mb-1 d-inline-block">Independiente</span>`).join('');
      return `<tr><td><span class="gc-dni">${p.DNI}</span></td>
      <td>${nombreVis}</td>
      <td>${cargos}</td>
      <td>${postulaCon}</td>
      <td class="gc-orgs">${p.organizaciones || '<span class="text-muted">—</span>'}</td>
      <td><button class="btn btn-sm btn-outline-secondary" onclick="abrirModalNuevaCandidatura('${p.DNI}', '${nombreVis.replace(/'/g, "\\'")}')">+ Postulación</button></td></tr>`;
    }).join('');
  }catch(err){
    tbody.innerHTML = '<tr><td colspan="6" class="text-danger text-center py-3">Error al cargar candidatos.</td></tr>';
  }
}

function switchTabCuentas(nombre, btn){
  document.getElementById('tab-usuarios').style.display = nombre === 'usuarios' ? 'block' : 'none';
  document.getElementById('tab-admins').style.display = nombre === 'admins' ? 'block' : 'none';
  document.getElementById('tab-candidatos').style.display = nombre === 'candidatos' ? 'block' : 'none';
  document.getElementById('tab-solicitudes').style.display = nombre === 'solicitudes' ? 'block' : 'none';
  document.querySelectorAll('.tab-barra button').forEach(b => b.classList.remove('activo'));
  if(btn){
    btn.classList.add('activo');
  }
}

function formatearFecha(fechaIso) {
  if(!fechaIso) return '—';
  const d = new Date(fechaIso);
  return d.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

async function cargarSolicitudesContraseña() {
  const tbody = document.getElementById('tbody-solicitudes');
  const badge = document.getElementById('badge-solicitudes');
  try{
    const data = await fetch('http://localhost:3000/api/solicitudes-contrasena', {
      credentials: 'include'
    }).then(r => r.json());

    if(!Array.isArray(data) || data.length === 0){
      badge.style.display = 'none';
      tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-3">No hay solicitudes pendientes.</td></tr>';
      return;
    }

    badge.style.display = '';
    badge.textContent = data.length;

    tbody.innerHTML = data.map(s => `<tr>
      <td><span class="gc-dni">${s.dni}</span></td>
      <td>${s.nombre} ${s.apellidoP} ${s.apellidoM}</td>
      <td>${formatearFecha(s.fechaSolicitud)}</td>
      <td>
        <button class="btn btn-sm btn-outline-success me-1" onclick="aprobarSolicitudContraseña(${s.solicitudId})">Aprobar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="rechazarSolicitudContraseña(${s.solicitudId})">Rechazar</button>
      </td>
      </tr>`).join('');
  }catch(err){
    badge.style.display = 'none';
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger text-center py-3">Error al cargar las solicitudes.</td></tr>';
  }
}

async function cargarHistorialSolicitudesContraseña() {
  const tbody = document.getElementById('tbody-historial-solicitudes');
  try{
    const data = await fetch('http://localhost:3000/api/solicitudes-contrasena/historial', {
      credentials: 'include'
    }).then(r => r.json());

    if(!Array.isArray(data) || data.length === 0){
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center py-3">Aún no hay solicitudes resueltas.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(s => `<tr>
      <td><span class="gc-dni">${s.dni}</span></td>
      <td>${s.nombre} ${s.apellidoP} ${s.apellidoM}</td>
      <td>${s.estado === 'aprobada'
        ? '<span class="badge text-bg-success">Aprobada</span>'
        : '<span class="badge text-bg-danger">Rechazada</span>'}</td>
      <td>${formatearFecha(s.fechaSolicitud)}</td>
      <td>${formatearFecha(s.fechaResolucion)}</td>
      </tr>`).join('');
  }catch(err){
    tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center py-3">Error al cargar el historial.</td></tr>';
  }
}

async function aprobarSolicitudContraseña(id) {
  if(!confirm('¿Aprobar esta solicitud? La contraseña se actualizará de inmediato.'))
    return;
  try{
    const res = await fetch(`http://localhost:3000/api/solicitudes-contrasena/${id}/aprobar`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if(!res.ok){
      alert(data.error || 'No se pudo aprobar la solicitud.');
      return;
    }
    cargarSolicitudesContraseña();
    cargarHistorialSolicitudesContraseña();
  }catch{
    alert('Error de conexión.');
  }
}

async function rechazarSolicitudContraseña(id) {
  if(!confirm('¿Rechazar esta solicitud? La contraseña actual se conserva.'))
    return;
  try{
    const res = await fetch(`http://localhost:3000/api/solicitudes-contrasena/${id}/rechazar`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if(!res.ok){
      alert(data.error || 'No se pudo rechazar la solicitud.');
      return;
    }
    cargarSolicitudesContraseña();
    cargarHistorialSolicitudesContraseña();
  }catch{
    alert('Error de conexión.');
  }
}

function filtrarTabla(inputId, tbodyId) {
  const q = document.getElementById(inputId).value.toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function llenarSelectEdicion(select, items, valueKey, labelKey, placeholder) {
  select.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') +
    items.map(i => `<option value="${i[valueKey]}">${i[labelKey]}</option>`).join('');
}

function onDepartamentoChangeEdicion() {
  const departamentoId = document.getElementById('ed-departamento').value;
  const selProvincia = document.getElementById('ed-provincia');
  const selDistrito = document.getElementById('ed-distrito');

  selDistrito.disabled = true;
  llenarSelectEdicion(selDistrito, [], 'distritoId', 'nombre', 'Selecciona una provincia primero');

  if(!departamentoId){
    selProvincia.disabled = true;
    llenarSelectEdicion(selProvincia, [], 'provinciaId', 'nombre', 'Selecciona un departamento primero');
    return;
  }

  const provincias = catalogos.provincias.filter(
    p => Number(p.departamentoId) === Number(departamentoId)
  );
  selProvincia.disabled = false;
  llenarSelectEdicion(selProvincia, provincias, 'provinciaId', 'nombre', 'Selecciona');
}

function onProvinciaChangeEdicion() {
  const provinciaId = document.getElementById('ed-provincia').value;
  const selDistrito = document.getElementById('ed-distrito');

  if(!provinciaId){
    selDistrito.disabled = true;
    llenarSelectEdicion(selDistrito,
    [],
    'distritoId',
    'nombre',
    'Selecciona una provincia primero');
    return;
  }

  const distritos = catalogos.distritos.filter(
    d => Number(d.provinciaId) === Number(provinciaId)
  );
  selDistrito.disabled = false;
  llenarSelectEdicion(selDistrito, distritos, 'distritoId', 'nombre', 'Selecciona');
}

async function abrirModalEditar(dni, tipo){
  const registro = tipo === 'admin' ? cacheAdmins[dni] : cacheUsuarios[dni];
  if(!registro)
    return;

  if(!catalogos.distritos || catalogos.distritos.length === 0){
    await cargarCatalogos();
  }

  document.getElementById('ed-dniOriginal').value = dni;
  document.getElementById('ed-tipo').value = tipo;
  document.getElementById('ed-dni').value = registro.DNI;
  document.getElementById('ed-nombre').value = registro.nombre;
  document.getElementById('ed-apellidoP').value = registro.apellidoP;
  document.getElementById('ed-apellidoM').value = registro.apellidoM;
  document.getElementById('ed-contraseña').value = '';

  const selDepartamento = document.getElementById('ed-departamento');
  llenarSelectEdicion(selDepartamento, catalogos.departamentos, 'departamentoId', 'nombre', 'Selecciona');
  const selProvincia = document.getElementById('ed-provincia');
  const selDistrito = document.getElementById('ed-distrito');
  const selCargo = document.getElementById('ed-cargo');
  llenarSelectEdicion(selCargo, catalogos.cargos, 'cargoId', 'nombre', 'Sin cargo');
  const selOrgNueva = document.getElementById('ed-org-nueva');
  llenarSelectEdicion(selOrgNueva, catalogos.organizaciones, 'organizacionId', 'nombre', 'Selecciona organización');
  const selPostulaCargo = document.getElementById('ed-postula-cargo');
  llenarSelectEdicion(selPostulaCargo, catalogos.cargos, 'cargoId', 'nombre', 'Selecciona cargo');
  const selPostulaOrg = document.getElementById('ed-postula-org');
  llenarSelectEdicion(selPostulaOrg, catalogos.organizaciones, 'organizacionId', 'nombre', 'Independiente (sin organización)');

  const distritoMatch = catalogos.distritos.find(d => d.nombre === registro.distrito);
  if(distritoMatch){
    const provinciaMatch = catalogos.provincias.find(p => p.provinciaId === distritoMatch.provinciaId);
    if(provinciaMatch){
      selDepartamento.value = provinciaMatch.departamentoId;
      onDepartamentoChangeEdicion();
      selProvincia.value = provinciaMatch.provinciaId;
      onProvinciaChangeEdicion();
      selDistrito.value = distritoMatch.distritoId;
    }else{
      onDepartamentoChangeEdicion();
    }
  }else{
    onDepartamentoChangeEdicion();
  }
  const cargoMatch = catalogos.cargos.find(c => c.nombre === registro.cargo);
  if(cargoMatch) selCargo.value = cargoMatch.cargoId;

  document.getElementById('ed-alerta').innerHTML = '';
  await cargarOrganizacionesActuales(dni);
  await cargarCandidaturasDePersona(dni);

  new bootstrap.Modal(document.getElementById('modalEditarCuenta')).show();
}

async function cargarCandidaturasDePersona(dni){
  const cont = document.getElementById('ed-candidaturas-actuales');
  cont.innerHTML = '<span class="text-muted small">Cargando...</span>';
  try{
    const data = await fetch('http://localhost:3000/api/candidatos', {
      credentials: 'include'
    }).then(r => r.json());

    const propias = Array.isArray(data) ? data.filter(c => c.DNI === dni) : [];
    if(propias.length === 0){
      cont.innerHTML = '<span class="text-muted small">No tiene ninguna postulación activa.</span>';
      return;
    }
    cont.innerHTML = propias.map(c => `<span class="badge bg-light text-dark border me-2 mb-2 p-2">${c.cargo}${c.organizacionPostula ? ` (${c.organizacionPostula})` : ' (Independiente)'}
      <button type="button" class="btn-close btn-close-sm ms-2" style="font-size:0.6rem" onclick="finalizarCandidaturaDesdeEdicion(${c.candidatoId})" title="Finalizar esta postulación"></button>
      </span>`).join('');
  }catch{
    cont.innerHTML = '<span class="text-danger small">Error al cargar postulaciones.</span>';
  }
}

async function postularComoCandidato() {
  const dni = document.getElementById('ed-dniOriginal').value;
  const cargoId = document.getElementById('ed-postula-cargo').value;
  const organizacionId = document.getElementById('ed-postula-org').value;

  if(!cargoId){
    alert('Selecciona el cargo al que postula.');
    return;
  }
  
  const yaPostula = Object.values(cacheCandidatos).some(c => c.DNI === dni && String(c.cargoId) === String(cargoId));
  if(yaPostula){
    alert('Esta persona ya tiene una postulación registrada a ese cargo.');
    return;
  }

  try{
    const res = await fetch('http://localhost:3000/api/candidatos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, cargoId, organizacionId: organizacionId || undefined })
    });
    const data = await res.json();
    if(!res.ok){
      alert(data.error || 'No se pudo registrar la postulación.');
      return;
    }
    document.getElementById('ed-postula-cargo').value = '';
    document.getElementById('ed-postula-org').value = '';
    await cargarCandidaturasDePersona(dni);
    cargarUsuarios();
    cargarAdmins();
    cargarCandidatos();
  }catch{
    alert('Error de conexión.');
  }
}

async function finalizarCandidaturaDesdeEdicion(candidatoId) {
  if(!confirm('¿Finalizar esta postulación? La persona seguirá teniendo su cuenta.'))
    return;
  const dni = document.getElementById('ed-dniOriginal').value;
  try{
    const res = await fetch(`http://localhost:3000/api/candidatos/${candidatoId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if(!res.ok){
      alert('No se pudo finalizar la postulación.');
      return;
    }
    await cargarCandidaturasDePersona(dni);
    cargarUsuarios();
    cargarAdmins();
    cargarCandidatos();
  } catch {
    alert('Error de conexión.');
  }
}

function abrirModalEditarCandidatura(candidatoId) {
  const c = cacheCandidatos[candidatoId];
  if(!c)
    return;

  document.getElementById('cd-candidatoId').value = candidatoId;
  document.getElementById('cd-dni').value = c.DNI;
  document.getElementById('cd-modal-titulo').textContent = 'Editar postulación';
  document.getElementById('cd-persona-nombre').innerHTML =
    `<span class="gc-dni">${c.DNI}</span> — ${nombreCompleto(c)}`;

  const selCargo = document.getElementById('cd-cargo');
  llenarSelectEdicion(selCargo, catalogos.cargos, 'cargoId', 'nombre', null);
  selCargo.value = c.cargoId;

  const selOrg = document.getElementById('cd-org');
  llenarSelectEdicion(selOrg, catalogos.organizaciones, 'organizacionId', 'nombre', 'Independiente (sin organización)');
  selOrg.value = c.organizacionId || '';

  document.getElementById('cd-btn-finalizar').style.display = '';
  document.getElementById('cd-alerta').innerHTML = '';
  new bootstrap.Modal(document.getElementById('modalEditarCandidatura')).show();
}

function abrirModalNuevaCandidatura(dni, nombreVisible){
  document.getElementById('cd-candidatoId').value = '';
  document.getElementById('cd-dni').value = dni;
  document.getElementById('cd-modal-titulo').textContent = 'Nueva postulación';
  document.getElementById('cd-persona-nombre').innerHTML = `<span class="gc-dni">${dni}</span> — ${nombreVisible}`;

  const selCargo = document.getElementById('cd-cargo');
  llenarSelectEdicion(selCargo, catalogos.cargos, 'cargoId', 'nombre', 'Selecciona cargo');
  selCargo.value = '';

  const selOrg = document.getElementById('cd-org');
  llenarSelectEdicion(selOrg, catalogos.organizaciones, 'organizacionId', 'nombre', 'Independiente (sin organización)');
  selOrg.value = '';

  document.getElementById('cd-btn-finalizar').style.display = 'none';
  document.getElementById('cd-alerta').innerHTML = '';
  new bootstrap.Modal(document.getElementById('modalEditarCandidatura')).show();
}

async function guardarEdicionCandidatura() {
  const candidatoId = document.getElementById('cd-candidatoId').value;
  const dni = document.getElementById('cd-dni').value;
  const cargoId = document.getElementById('cd-cargo').value;
  const organizacionId = document.getElementById('cd-org').value;
  const alertaEl = document.getElementById('cd-alerta');
  alertaEl.innerHTML = '';

  if(!cargoId){
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">Selecciona el cargo al que postula.</div>';
    return;
  }

  const esNueva = !candidatoId;
  
  if(esNueva){
    const yaPostula = Object.values(cacheCandidatos).some(
      c => c.DNI === dni && String(c.cargoId) === String(cargoId)
    );
    if(yaPostula){
      alertaEl.innerHTML = '<div class="alert alert-danger py-2">Esta persona ya tiene una postulación registrada a ese cargo.</div>';
      return;
    }
  }

  const url = esNueva
    ? 'http://localhost:3000/api/candidatos'
    : `http://localhost:3000/api/candidatos/${candidatoId}`;
  const body = esNueva
    ? { dni, cargoId, organizacionId: organizacionId || undefined }
    : { cargoId, organizacionId: organizacionId || null };

  try{
    const res = await fetch(url, {
      method: esNueva ? 'POST' : 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if(!res.ok){
      alertaEl.innerHTML = `<div class="alert alert-danger py-2">${data.error || 'No se pudo guardar.'}</div>`;
      return;
    }
    bootstrap.Modal.getInstance(document.getElementById('modalEditarCandidatura')).hide();
    cargarCandidatos();
    cargarUsuarios();
    cargarAdmins();
  }catch{
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">Error de conexión con el servidor.</div>';
  }
}

async function finalizarCandidatura(){
  const candidatoId = document.getElementById('cd-candidatoId').value;
  if(!confirm('¿Finalizar esta postulación? La cuenta de la persona no se elimina, y si no tiene otra postulación activa volverá a la lista de Usuarios.'))
    return;

  try{
    const res = await fetch(`http://localhost:3000/api/candidatos/${candidatoId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if(!res.ok){
      const data = await res.json();
      alert(data.error || 'No se pudo finalizar la postulación.');
      return;
    }
    bootstrap.Modal.getInstance(document.getElementById('modalEditarCandidatura')).hide();
    cargarCandidatos();
    cargarUsuarios();
    cargarAdmins();
  }catch{
    alert('Error de conexión.');
  }
}

async function cargarOrganizacionesActuales(dni) {
  const cont = document.getElementById('ed-orgs-actuales');
  cont.innerHTML = '<span class="text-muted small">Cargando…</span>';
  try{
    const orgs = await fetch(`http://localhost:3000/api/usuarios/${dni}/organizaciones`, {
      credentials: 'include'
    }).then(r => r.json());

    if(!Array.isArray(orgs) || orgs.length === 0){
      cont.innerHTML = '<span class="text-muted small">No pertenece a ninguna organización.</span>';
      return;
    }
    cont.innerHTML = orgs.map(o => `<span class="badge bg-light text-dark border me-2 mb-2 p-2">${o.nombre} (${o.rolInterno})<button type="button" class="btn-close btn-close-sm ms-2" style="font-size:0.6rem" onclick="quitarDeOrganizacion('${dni}', ${o.organizacionId})" title="Quitar de la organización"></button>
      </span>`).join('');
  }catch{
    cont.innerHTML = '<span class="text-danger small">Error al cargar organizaciones.</span>';
  }
}

async function quitarDeOrganizacion(dni, organizacionId) {
  if(!confirm('¿Quitar a esta persona de la organización? Esto no elimina su cuenta.'))
    return;
  try{
    const res = await fetch(`http://localhost:3000/api/organizacion-miembros/${dni}/${organizacionId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if(!res.ok){
      alert('No se pudo quitar de la organización.');
      return;
    }
    await cargarOrganizacionesActuales(dni);
    cargarUsuarios();
    cargarAdmins();
  }catch{
    alert('Error de conexión.');
  }
}

async function agregarOrganizacionEdicion() {
  const dni = document.getElementById('ed-dniOriginal').value;
  const organizacionId = document.getElementById('ed-org-nueva').value;
  const rolInterno = document.getElementById('ed-org-rol').value.trim();
  if(!organizacionId){
    alert('Selecciona una organización.');
    return;
  }
  try{
    const res = await fetch('http://localhost:3000/api/organizacion-miembros', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, organizacionId, rolInterno: rolInterno || undefined })
    });
    const data = await res.json();
    if(!res.ok){
      alert(data.error || 'No se pudo añadir a la organización.');
      return;
    }
    document.getElementById('ed-org-nueva').value = '';
    document.getElementById('ed-org-rol').value = '';
    await cargarOrganizacionesActuales(dni);
    cargarUsuarios();
    cargarAdmins();
  }catch{
    alert('Error de conexión.');
  }
}

async function guardarEdicionCuenta(){
  const dniOriginal = document.getElementById('ed-dniOriginal').value;
  const DNI = document.getElementById('ed-dni').value.trim();
  const nombre = document.getElementById('ed-nombre').value.trim();
  const apellidoP = document.getElementById('ed-apellidoP').value.trim();
  const apellidoM = document.getElementById('ed-apellidoM').value.trim();
  const contraseña = document.getElementById('ed-contraseña').value;
  const distritoId = document.getElementById('ed-distrito').value;
  const cargoId = document.getElementById('ed-cargo').value;

  const alertaEl = document.getElementById('ed-alerta');
  alertaEl.innerHTML = '';

  if(!DNI || DNI.length !== 8 || !nombre || !apellidoP || !apellidoM || !distritoId){
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">Completa DNI (8 dígitos), nombre, apellidos y distrito.</div>';
    return;
  }

  if(contraseña && contraseña.length < 9){
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">La nueva contraseña debe tener al menos 9 caracteres.</div>';
    return;
  }

  try{
    const res = await fetch(`http://localhost:3000/api/cuentas/${dniOriginal}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        DNI,
        nombre,
        apellidoP,
        apellidoM,
        contraseña: contraseña || undefined,
        distritoId,
        cargoId: cargoId || null
      })
    });
    const data = await res.json();
    if(!res.ok){
      alertaEl.innerHTML = `<div class="alert alert-danger py-2">${data.error || 'No se pudo guardar.'}</div>`;
      return;
    }
    bootstrap.Modal.getInstance(document.getElementById('modalEditarCuenta')).hide();
    cargarUsuarios();
    cargarAdmins();
  }catch {
    alertaEl.innerHTML = '<div class="alert alert-danger py-2">Error de conexión con el servidor.</div>';
  }
}

initGestionCuenta();