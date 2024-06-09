import express from 'express'

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

// Usuarios autorizados (solo para fines de demostración)
const users = [
    { id: 1, username: 'usuario', password: 'contraseña' }
];

// Ruta de inicio de sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ userId: user.id }, 'secret', { expiresIn: '1d' }); // Genera un token válido por un día
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});

// Middleware para verificar token de autenticación
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'secret', (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.userId = decoded.userId;
        next();
    });
}

// Ruta para verificar la autenticación
app.post('/verify', verifyToken, (req, res) => {
    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000');
});
