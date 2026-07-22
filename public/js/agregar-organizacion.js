let miembrosPendientes = [];

async function initAgregarOrganizacion() {
  const s = await fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include'
  }).then(r => r.json());
  if (s.tipo !== 'admin') {
    location.href = '/login-usuario';
    return;
  }
}

function toggleRolCustom() {
  const sel = document.getElementById('miembroRolSel');
  const inp = document.getElementById('miembroRolCustom');
  const esOtro = sel.value === '__otro__';
  inp.style.display = esOtro ? '' : 'none';
  if (!esOtro) {
    inp.value = '';
  }
}

function obtenerRolElegido() {
  const sel = document.getElementById('miembroRolSel');
  if (sel.value === '__otro__') {
    const custom = document.getElementById('miembroRolCustom').value.trim();
    return custom || 'Miembro';
  }
  return sel.value;
}

function agregarFilaMiembro() {
  const dniEl = document.getElementById('miembroDni');
  const dni = dniEl.value.trim();

  if (!dni || dni.length !== 8) {
    marcarError(dniEl);
    return;
  }
  quitarError(dniEl);

  if (miembrosPendientes.some(m => m.dni === dni)) {
    marcarError(dniEl);
    mostrarAlerta('alerta', `El DNI ${dni} ya fue añadido a la lista.`, 'error');
    return;
  }

  const rolInterno = obtenerRolElegido();
  miembrosPendientes.push({ dni, rolInterno });
  renderListaMiembros();

  dniEl.value = '';
  document.getElementById('miembroRolSel').value = 'Miembro';
  document.getElementById('miembroRolCustom').value = '';
  document.getElementById('miembroRolCustom').style.display = 'none';
}

function renderListaMiembros() {
  const lista = document.getElementById('listaMiembros');
  if (!miembrosPendientes.length) {
    lista.innerHTML = '';
    return;
  }
  lista.innerHTML = miembrosPendientes.map((m, idx) => `<div class="miembro-fila d-flex justify-content-between align-items-center">
  <div>
  <span class="fw-semibold">${m.dni}</span>
  <span class="text-muted ms-2">— ${m.rolInterno}</span>
  </div>
  <button class="btn-remove" onclick="eliminarMiembro(${idx})" title="Quitar">✕</button>
  </div>`).join('');
}

function eliminarMiembro(idx) {
  miembrosPendientes.splice(idx, 1);
  renderListaMiembros();
}

async function guardarOrganizacion() {
  const nombreEl = document.getElementById('nombreOrganizacion');
  const nombre = nombreEl.value.trim();
  const tipo = document.getElementById('tipoOrganizacion').value;

  if (!nombre) {
    marcarError(nombreEl);
    mostrarAlerta('alerta', 'El nombre de la organización es obligatorio.', 'error');
    return;
  }
  quitarError(nombreEl);

  try {
    const res = await fetch('http://localhost:3000/api/organizaciones', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tipo })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alerta', data.error || 'Error al guardar la organización.', 'error');
      return;
    }

    const organizacionId = data.organizacionId;

    if (miembrosPendientes.length > 0) {
      let errores = [];
      for (const { dni, rolInterno } of miembrosPendientes) {
        const resM = await fetch('http://localhost:3000/api/organizacion-miembros', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni, organizacionId, rolInterno })
        });
        if (!resM.ok) {
          const errData = await resM.json();
          if (resM.status !== 409) {
            errores.push(`DNI ${dni}: ${errData.error || 'error desconocido'}`);
          }
        }
      }

      if (errores.length > 0) {
        mostrarAlerta('alerta',
          `Organización creada, pero algunos miembros no pudieron asignarse:\n${errores.join(' | ')}`,
          'exito'
        );
      } else {
        mostrarAlerta('alerta',
          `Organización creada y ${miembrosPendientes.length} miembro(s) asignado(s) correctamente.`,
          'exito'
        );
      }
    } else {
      mostrarAlerta('alerta', 'Organización creada correctamente.', 'exito');
    }

    nombreEl.value = '';
    document.getElementById('tipoOrganizacion').value = 'partido';
    miembrosPendientes = [];
    renderListaMiembros();
  } catch (e) {
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}

async function guardarCargo() {
  const nombreEl = document.getElementById('nombreCargo');
  const nombre = nombreEl.value.trim();
  const tipo = document.getElementById('tipoCargo').value;

  if (!nombre) {
    marcarError(nombreEl);
    mostrarAlerta('alertaCargo', 'El nombre del cargo es obligatorio.', 'error');
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
      mostrarAlerta('alertaCargo', data.error || 'Error al guardar el cargo.', 'error');
      return;
    }
    mostrarAlerta('alertaCargo', 'Cargo creado correctamente.', 'exito');
    nombreEl.value = '';
    document.getElementById('tipoCargo').value = 'nacional';
  } catch (e) {
    mostrarAlerta('alertaCargo', 'Error de conexión.', 'error');
  }
}

async function guardarDistrito() {
  const nombreEl = document.getElementById('nombreDistrito');
  const nombre = nombreEl.value.trim();

  if (!nombre) {
    marcarError(nombreEl);
    mostrarAlerta('alertaDistrito', 'El nombre del distrito es obligatorio.', 'error');
    return;
  }
  quitarError(nombreEl);

  try {
    const res = await fetch('http://localhost:3000/api/distritos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarAlerta('alertaDistrito', data.error || 'Error al guardar el distrito.', 'error');
      return;
    }
    mostrarAlerta('alertaDistrito', 'Distrito creado correctamente.', 'exito');
    nombreEl.value = '';
  } catch (e) {
    mostrarAlerta('alertaDistrito', 'Error de conexión.', 'error');
  }
}

initAgregarOrganizacion();