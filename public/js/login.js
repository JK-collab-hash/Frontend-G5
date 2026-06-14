async function ingresar() {
  const tienePassword = document.getElementById('pass');
  if(tienePassword) {
    ingresarAdmin();
  } else {
    ingresarUsuario();
  }
}
async function ingresarUsuario() {
  const dni = document.getElementById('dni').value.trim();
  if(!dni){ mostrarAlerta('alerta', 'Por favor ingresa tu DNI.', 'error');
    return;
  }
  try{
    const res = await fetch('http://localhost:3000/api/auth/usuario', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni })
    });
    const data = await res.json();
    if(!res.ok){
      mostrarAlerta('alerta', data.error || 'Error al ingresar.', 'error');
      return;
    }
    location.href = '/votacion';
  }catch(e){
    mostrarAlerta('alerta', 'Error de conexión con el servidor.', 'error');
  }
}
async function ingresarAdmin() {
  const dni = document.getElementById('dni').value.trim();
  const contrasena = document.getElementById('pass').value;
  if(!dni || !contrasena){
    mostrarAlerta('alerta', 'Completa todos los campos.', 'error');
    return;
  }
  try {
    const res  = await fetch('http://localhost:3000/api/auth/admin', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, contrasena })
    });
    const data = await res.json();
    if(!res.ok){
      mostrarAlerta('alerta', data.error || 'Credenciales incorrectas.', 'error');
      return;
    }
    location.href = '/dashboard';
  }catch(e){
    mostrarAlerta('alerta', 'Error de conexión.', 'error');
  }
}
