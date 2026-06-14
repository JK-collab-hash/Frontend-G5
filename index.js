const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/templates')));

app.get('/login-usuario', (req, res) => res.sendFile(path.join(__dirname, 'public/templates/login-usuario.html')));
app.get('/login-admin', (req, res) => res.sendFile(path.join(__dirname, 'public/templates/login-admin.html')));
app.get('/votacion', (req, res) => res.sendFile(path.join(__dirname, 'public/templates/votacion.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/templates/dashboard.html')));
app.get('/agregar-usuario', (req, res) => res.sendFile(path.join(__dirname, 'public/templates/agregar-usuario.html')));
app.get('/agregar-admin', (req, res) => res.sendFile(path.join(__dirname, 'public/templates/agregar-admin.html')));
app.get('/crear-votacion', (req, res) => res.sendFile(path.join(__dirname, 'public/templates/crear-votacion.html')));

app.listen(3001, () => console.log('Frontend en http://localhost:3001/login-usuario'));