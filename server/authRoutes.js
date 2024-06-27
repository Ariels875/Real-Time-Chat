import express from 'express';
import jwt from 'jsonwebtoken';
import UserHandle from './userHandle.js'; 
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Ruta para el login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await UserHandle.login(username, password);
    const token = jbt.sing({ id: user._id, username: user.username }, process.env.JWT_SECRET,{
      expiresIn: '1h'
    });
    res.send({ user });
  } catch (e) {
    res.status(401).send(e.message);
  }
});

// Ruta para el registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const id = await UserHandle.create(username, password);
    res.send({ id });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// Ruta para el logout
router.post('/logout', (req, res) => {
  // Lógica para cerrar sesión del usuario
  res.send('Logout route');
});

// Ruta protegida
router.get('/protected', (req, res) => {
  // Lógica para verificar si el usuario está autenticado
  res.send('Protected route');
});

export default router;
