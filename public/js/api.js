
const Api = (() => {
  const BASE_URL = 'http://localhost:3000/api';

  async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }
    return data;
  }

  const get = (path) => request(path);
  const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
  const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
  const del = (path) => request(path, { method: 'DELETE' });

  return {
    login: (dni, contraseña) => post('/auth/login', { dni, contraseña }),
    logout: () => post('/auth/logout', {}),
    getSession: () => get('/auth/session'),
    
    getVotacionesDisponibles: () => get('/votaciones/disponibles'),
    registrarVoto: (voto) => post('/votaciones/votar', voto),
    getResultados: () => get('/votaciones/resultados'),
    crearVotacion: (datos) => post('/votaciones/crear', datos),
    toggleVotacion: (id) => post(`/votaciones/toggle/${id}`, {}),
    cerrarVotacion: (id) => post(`/votaciones/cerrar/${id}`, {}),
    
    listarUsuarios: () => get('/usuarios'),
    crearUsuario: (datos) => post('/usuarios', datos),
    listarOrganizacionesDeUsuario: (dni) => get(`/usuarios/${dni}/organizaciones`),
    listarAdmins: () => get('/admins'),
    crearAdmin: (datos) => post('/admins', datos),
    actualizarCuenta: (dni, datos) => put(`/cuentas/${dni}`, datos),
    
    listarCandidatos: (filtros = {}) => get(`/candidatos?${new URLSearchParams(filtros)}`),
    crearCandidato: (datos) => post('/candidatos', datos),
    actualizarCandidato: (candidatoId, datos) => put(`/candidatos/${candidatoId}`, datos),
    finalizarCandidatura: (candidatoId) => del(`/candidatos/${candidatoId}`),
    
    listarOrganizaciones: () => get('/organizaciones'),
    crearOrganizacion: (datos) => post('/organizaciones', datos),
    actualizarOrganizacion: (id, datos) => put(`/organizaciones/${id}`, datos),
    eliminarOrganizacion: (id) => del(`/organizaciones/${id}`),
    agregarMiembroOrganizacion: (datos) => post('/organizacion-miembros', datos),
    quitarMiembroOrganizacion: (dni, organizacionId) => del(`/organizacion-miembros/${dni}/${organizacionId}`),
    
    getCatalogos: () => get('/catalogos'),
    listarCargos: () => get('/cargos'),
    crearCargo: (datos) => post('/cargos', datos),
    actualizarCargo: (id, datos) => put(`/cargos/${id}`, datos),
    eliminarCargo: (id) => del(`/cargos/${id}`),

    listarDepartamentos: () => get('/departamentos'),
    crearDepartamento: (datos) => post('/departamentos', datos),
    actualizarDepartamento: (id, datos) => put(`/departamentos/${id}`, datos),
    eliminarDepartamento: (id) => del(`/departamentos/${id}`),

    listarProvincias: () => get('/provincias'),
    crearProvincia: (datos) => post('/provincias', datos),
    actualizarProvincia: (id, datos) => put(`/provincias/${id}`, datos),
    eliminarProvincia: (id) => del(`/provincias/${id}`),

    listarDistritos: () => get('/distritos'),
    crearDistrito: (datos) => post('/distritos', datos),
    actualizarDistrito: (id, datos) => put(`/distritos/${id}`, datos),
    eliminarDistrito: (id) => del(`/distritos/${id}`),
  };
})();
