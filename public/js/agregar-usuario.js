const ROLES_INTERNOS = [
  'Miembro',
  'Secretario General',
  'Secretario',
  'Decano',
  'Presidente',
  'Vicepresidente',
  'Tesorero',
  'Vocal',
  'Gerente',
  'Director',
  'Coordinador',
];

let catalogosGlobal = { departamentos: [], provincias: [], distritos: [] };

async function initAgregarUsuario() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if (s.tipo !== 'admin') {
    location.href = '/login-usuario';
    return;
  }
  await recargarCatalogos();
  llenarSelect('cargoPostula', catalogosGlobal.cargos, 'cargoId');
  llenarSelect('cargoGeneral', catalogosGlobal.cargos, 'cargoId');
  llenarCheckboxesOrganizacion(catalogosGlobal.organizaciones);
  actualizarFormulario();
}

async function recargarCatalogos() {
  const cat = await fetch('http://localhost:3000/api/catalogos', {
    credentials: 'include'
  }).then(r => r.json());
  catalogosGlobal = cat;
  llenarSelect('departamento', cat.departamentos, 'departamentoId');
  return cat;
}

function llenarSelectManual(selectId, lista, idField, placeholder) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  lista.forEach(item => {
    const o = document.createElement('option');
    o.value = item[idField];
    o.textContent = item.nombre;
    sel.appendChild(o);
  });
}

function onDepartamentoChange() {
  const departamentoId = document.getElementById('departamento').value;
  const selProvincia = document.getElementById('provincia');
  const selDistrito = document.getElementById('distrito');

  selDistrito.disabled = true;
  llenarSelectManual('distrito', [], 'distritoId', 'Selecciona una provincia primero');

  if (!departamentoId) {
    selProvincia.disabled = true;
    llenarSelectManual('provincia', [], 'provinciaId', 'Selecciona un departamento primero');
    return;
  }

  const provincias = catalogosGlobal.provincias.filter(
    p => Number(p.departamentoId) === Number(departamentoId)
  );
  selProvincia.disabled = false;
  llenarSelectManual('provincia', provincias, 'provinciaId', 'Selecciona');
}

function onProvinciaChange() {
  const provinciaId = document.getElementById('provincia').value;
  const selDistrito = document.getElementById('distrito');

  if (!provinciaId) {
    selDistrito.disabled = true;
    llenarSelectManual('distrito', [], 'distritoId', 'Selecciona una provincia primero');
    return;
  }

  const distritos = catalogosGlobal.distritos.filter(
    d => Number(d.provinciaId) === Number(provinciaId)
  );
  selDistrito.disabled = false;
  llenarSelectManual('distrito', distritos, 'distritoId', 'Selecciona');
}

function toggleNuevo(nivel) {
  const div = document.getElementById(`nuevo-${nivel}`);
  div.style.display = div.style.display === 'none' ? 'flex' : 'none';
}

async function crearDepartamentoRapido() {
  const input = document.getElementById('nuevo-departamento-nombre');
  const nombre = input.value.trim();
  if (!nombre) {
    return;
  }
  try {
    const res = await fetch('http://localhost:3000/api/departamentos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta', data.error || 'Error al crear el departamento.', 'error');
      return;
    }
    input.value = '';
    toggleNuevo('departamento');
    await recargarCatalogos();
    document.getElementById('departamento').value = data.departamentoId;
    onDepartamentoChange();
    mostrarAlerta('alerta', 'Departamento creado. Ya puedes seleccionarlo.', 'exito');
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

async function crearProvinciaRapida() {
  const departamentoId = document.getElementById('departamento').value;
  if (!departamentoId) {
    mostrarAlerta('alerta', 'Primero selecciona el departamento al que pertenece la provincia.', 'error');
    return;
  }
  const input = document.getElementById('nuevo-provincia-nombre');
  const nombre = input.value.trim();
  if (!nombre) {
    return;
  }
  try {
    const res = await fetch('http://localhost:3000/api/provincias', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, departamentoId })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta', data.error || 'Error al crear la provincia.', 'error');
      return;
    }
    input.value = '';
    toggleNuevo('provincia');
    await recargarCatalogos();
    document.getElementById('departamento').value = departamentoId;
    onDepartamentoChange();
    document.getElementById('provincia').value = data.provinciaId;
    onProvinciaChange();
    mostrarAlerta('alerta', 'Provincia creada. Ya puedes seleccionarla.', 'exito');
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

async function crearDistritoRapido() {
  const provinciaId = document.getElementById('provincia').value;
  if (!provinciaId) {
    mostrarAlerta('alerta', 'Primero selecciona la provincia a la que pertenece el distrito.', 'error');
    return;
  }
  const input = document.getElementById('nuevo-distrito-nombre');
  const nombre = input.value.trim();
  if (!nombre) {
    return;
  }
  try {
    const res = await fetch('http://localhost:3000/api/distritos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, provinciaId })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta', data.error || 'Error al crear el distrito.', 'error');
      return;
    }
    input.value = '';
    toggleNuevo('distrito');
    const departamentoId = document.getElementById('departamento').value;
    await recargarCatalogos();
    document.getElementById('departamento').value = departamentoId;
    onDepartamentoChange();
    document.getElementById('provincia').value = provinciaId;
    onProvinciaChange();
    document.getElementById('distrito').value = data.distritoId;
    mostrarAlerta('alerta', 'Distrito creado. Ya puedes seleccionarlo.', 'exito');
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

function crearSelectRol(orgId) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.gap = '6px';
  wrapper.style.alignItems = 'center';

  const sel = document.createElement('select');
  sel.className = 'form-select form-select-sm';
  sel.id = `rol-sel-${orgId}`;
  sel.disabled = true;

  ROLES_INTERNOS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    sel.appendChild(opt);
  });

  const optOtro = document.createElement('option');
  optOtro.value = '__otro__';
  optOtro.textContent = 'Otro…';
  sel.appendChild(optOtro);

  const inputCustom = document.createElement('input');
  inputCustom.className = 'form-control form-control-sm';
  inputCustom.type = 'text';
  inputCustom.id = `rol-custom-${orgId}`;
  inputCustom.placeholder = 'Escribe el rol';
  inputCustom.style.display = 'none';
  inputCustom.disabled = true;

  sel.addEventListener('change', () => {
    const esOtro = sel.value === '__otro__';
    inputCustom.style.display = esOtro ? '' : 'none';
    inputCustom.disabled = !esOtro;
    if (!esOtro) {
      inputCustom.value = '';
    }
  });

  wrapper.appendChild(sel);
  wrapper.appendChild(inputCustom);
  return wrapper;
}

function llenarCheckboxesOrganizacion(organizaciones) {
  const contenedor = document.getElementById('organizacion-checkboxes');
  contenedor.innerHTML = '';

  if (!organizaciones || organizaciones.length === 0) {
    contenedor.innerHTML = '<p class="text-muted mb-0">No hay organizaciones registradas.</p>';
    return;
  }

  organizaciones.forEach(org => {
    const fila = document.createElement('div');
    fila.className = 'row align-items-center mb-2 organizacion-fila';

    const colCheck = document.createElement('div');
    colCheck.className = 'col-md-5';
    const divCheck = document.createElement('div');
    divCheck.className = 'form-check';

    const chk = document.createElement('input');
    chk.className = 'form-check-input';
    chk.type = 'checkbox';
    chk.value = org.organizacionId;
    chk.id = `org-${org.organizacionId}`;
    chk.name = 'organizacion';

    const lbl = document.createElement('label');
    lbl.className = 'form-check-label';
    lbl.setAttribute('for', `org-${org.organizacionId}`);
    lbl.textContent = `${org.nombre} (${org.tipo})`;

    divCheck.appendChild(chk);
    divCheck.appendChild(lbl);
    colCheck.appendChild(divCheck);

    const colRol = document.createElement('div');
    colRol.className = 'col-md-7';
    const selectWrapper = crearSelectRol(org.organizacionId);
    colRol.appendChild(selectWrapper);

    chk.addEventListener('change', () => {
      const sel = document.getElementById(`rol-sel-${org.organizacionId}`);
      const inp = document.getElementById(`rol-custom-${org.organizacionId}`);
      sel.disabled = !chk.checked;
      if (!chk.checked) {
        sel.value = ROLES_INTERNOS[0];
        inp.style.display = 'none';
        inp.disabled = true;
        inp.value = '';
      }
    });

    fila.appendChild(colCheck);
    fila.appendChild(colRol);
    contenedor.appendChild(fila);
  });
}

function obtenerOrganizacionesSeleccionadas() {
  return Array.from(
    document.querySelectorAll('#organizacion-checkboxes input[type="checkbox"]:checked')
  ).map(chk => {
    const orgId = chk.value;
    const sel = document.getElementById(`rol-sel-${orgId}`);
    const inp = document.getElementById(`rol-custom-${orgId}`);

    let rolInterno = null;
    if (sel) {
      if (sel.value === '__otro__') {
        rolInterno = inp && inp.value.trim() ? inp.value.trim() : null;
      } else {
        rolInterno = sel.value || null;
      }
    }
    return { organizacionId: orgId, rolInterno };
  });
}

function actualizarFormulario() {
  const tipo = document.getElementById('tipoCuenta').value;
  document.getElementById('bloque-candidato').style.display = (tipo === 'candidato') ? '' : 'none';
  document.getElementById('bloque-cargo-general').style.display = (tipo === 'candidato') ? 'none' : '';
}

function validarCamposComunes() {
  let ok = true;
  const campos = [
    { id: 'dni', check: v => v.length === 8 },
    { id: 'nombre', check: v => v.length > 0 },
    { id: 'apellidoP', check: v => v.length > 0 },
    { id: 'apellidoM', check: v => v.length > 0 },
    { id: 'contraseña', check: v => v.length >= 9 },
    { id: 'departamento', check: v => v !== '' },
    { id: 'provincia', check: v => v !== '' },
    { id: 'distrito', check: v => v !== '' },
  ];
  campos.forEach(({ id, check }) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    const val = el.value.trim ? el.value.trim() : el.value;
    if (!check(val)) {
      marcarError(el);
      ok = false;
    } else {
      quitarError(el);
    }
  });
  return ok;
}

async function guardar() {
  const tipo = document.getElementById('tipoCuenta').value;

  if (!validarCamposComunes()) {
    mostrarAlerta('alerta', 'Corrige los campos marcados en rojo.', 'error');
    return;
  }

  const DNI = document.getElementById('dni').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const apellidoP = document.getElementById('apellidoP').value.trim();
  const apellidoM = document.getElementById('apellidoM').value.trim();
  const contraseña = document.getElementById('contraseña').value;
  const distritoId = document.getElementById('distrito').value;
  const cargoGeneralId = document.getElementById('cargoGeneral').value || null;

  if (tipo === 'candidato') {
    const cargoPostulaEl = document.getElementById('cargoPostula');
    if (!cargoPostulaEl.value) {
      marcarError(cargoPostulaEl);
      mostrarAlerta('alerta', 'Corrige los campos marcados en rojo.', 'error');
      return;
    }
    quitarError(cargoPostulaEl);
    await crearCandidatoCompleto(DNI, nombre, apellidoP, apellidoM, contraseña, distritoId);
  } else if (tipo === 'admin') {
    await crearAdmin(DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoGeneralId);
  } else {
    await crearUsuarioNormal(DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoGeneralId);
  }
}

async function asociarOrganizaciones(DNI, organizaciones) {
  let errores = 0;
  for (const { organizacionId, rolInterno } of organizaciones) {
    const res = await fetch('http://localhost:3000/api/organizacion-miembros', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni: DNI, organizacionId, rolInterno })
    });
    if (!res.ok && res.status !== 409) {
      errores++;
    }
  }
  return errores;
}

async function crearUsuarioNormal(DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId) {
  const organizaciones = obtenerOrganizacionesSeleccionadas();
  try {
    const res = await fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta', data.error || 'Error al guardar.', 'error');
      return;
    }
    const errores = await asociarOrganizaciones(DNI, organizaciones);
    mostrarAlerta('alerta',
      errores > 0
        ? 'Usuario creado, pero hubo un problema al asociar alguna organización.'
        : 'Usuario creado correctamente.',
      'exito'
    );
    limpiarFormulario();
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

async function crearAdmin(DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId) {
  const organizaciones = obtenerOrganizacionesSeleccionadas();
  try {
    const res = await fetch('http://localhost:3000/api/admins', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta', data.error || 'Error al guardar.', 'error');
      return;
    }

    const errores = await asociarOrganizaciones(DNI, organizaciones);
    mostrarAlerta('alerta',
      errores > 0
        ? 'Administrador creado, pero hubo un problema al asociar alguna organización.'
        : 'Administrador creado correctamente.',
      'exito'
    );
    limpiarFormulario();
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

async function crearCandidatoCompleto(DNI, nombre, apellidoP, apellidoM, contraseña, distritoId) {
  const cargoId = document.getElementById('cargoPostula').value;
  const organizaciones = obtenerOrganizacionesSeleccionadas();

  try {
    const resU = await fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ DNI, nombre, apellidoP, apellidoM, contraseña, distritoId })
    });
    const dataU = await resU.json();
    if (!resU.ok) {
      if (resU.status === 409) {
        
        mostrarAlerta(
          'alerta',
          (dataU.error || 'Ya existe una cuenta con ese DNI.') + 'Las postulaciones se pueden añadir en la gestion de cuentas',
          'error'
        );
      } else {
        mostrarAlerta('alerta', dataU.error || 'Error al crear el usuario.', 'error');
      }
      return;
    }

    const orgPrincipal = organizaciones[0] ? organizaciones[0].organizacionId : null;
    const resC = await fetch('http://localhost:3000/api/candidatos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni: DNI, cargoId, organizacionId: orgPrincipal })
    });
    const dataC = await resC.json();
    if (!resC.ok) {
      mostrarAlerta('alerta', dataC.error || 'Error al registrar la candidatura.', 'error');
      return;
    }

    const errores = await asociarOrganizaciones(DNI, organizaciones);
    mostrarAlerta('alerta',
      errores > 0
        ? 'Candidato registrado, pero hubo un problema al asociar alguna organización.'
        : 'Candidato registrado correctamente.',
      'exito'
    );
    limpiarFormulario();
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

function limpiarFormulario() {
  ['dni', 'nombre', 'apellidoP', 'apellidoM', 'contraseña'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      quitarError(el);
    }
  });
  ['cargoPostula', 'cargoGeneral'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      quitarError(el);
    }
  });

  document.getElementById('departamento').value = '';
  quitarError(document.getElementById('departamento'));
  onDepartamentoChange();
  quitarError(document.getElementById('provincia'));
  quitarError(document.getElementById('distrito'));

  document.querySelectorAll('#organizacion-checkboxes input[type="checkbox"]').forEach(chk => {
    chk.checked = false;
    const sel = document.getElementById(`rol-sel-${chk.value}`);
    const inp = document.getElementById(`rol-custom-${chk.value}`);
    if (sel) {
      sel.value = ROLES_INTERNOS[0];
      sel.disabled = true;
    }
    if (inp) {
      inp.value = '';
      inp.style.display = 'none';
      inp.disabled = true;
    }
  });
}

initAgregarUsuario();