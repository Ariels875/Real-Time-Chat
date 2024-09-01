import express from 'express';
import path from 'path';
import logger from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import UserHandle from './userHandle.js';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const port = process.env.PORT || 3000;

/* Define __dirname*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.DB_TOKEN
});

/*Middleware para parsear el cuerpo de las solicitudes POST y cookies*/
app.use(express.json());
app.use(cookieParser());
app.use(logger('dev'));

// Configura el tipo MIME para CSS
app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});

/*Middleware para verificar el token JWT*/
app.use((req, res, next) => {
  const token = req.cookies.access_token;

  req.session = { user: null };
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.session.user = data;
  } catch {}

  next();
});

/*Rutas para la base de datos*/
await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    user TEXT
  )
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )
`);

/* Manejar conexiones de Socket.IO */
io.on('connection', async (socket) => {
  console.log('a user has connected!');

  socket.on('disconnect', () => {
    console.log('a user has disconnected');
  });

  socket.on('chat message', async (msg) => {
    let result;
    const username = socket.handshake.auth.username ?? 'anonymous';
    console.log({ username });
    try {
      result = await db.execute({
        sql: 'INSERT INTO messages (content, user) VALUES (:msg, :username)',
        args: { msg, username }
      });
    } catch (e) {
      console.error(e);
      return;
    }

    io.emit('chat message', msg, result.lastInsertRowid.toString(), username);
  });

  if (!socket.recovered) {
    try {
      const results = await db.execute({
        sql: 'SELECT id, content, user FROM messages WHERE id > ?',
        args: [socket.handshake.auth.serverOffset ?? 0]
      });

      results.rows.forEach(row => {
        socket.emit('chat message', row.content, row.id.toString(), row.user);
      });
    } catch (e) {
      console.error(e);
    }
  }
});

/* Ruta para obtener el nombre de usuario */
app.get('/username', (req, res) => {
  const { user } = req.session;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized xd' });
  }
  res.json({ username: user.username });
});

/* Ruta protegida */
app.get('/index', (req, res) => {
  const { user } = req.session;
  if (!user) return res.redirect('/login');
  res.sendFile(path.resolve(__dirname + '/../client/index.html'));
});

/* Ruta principal */
app.get('/', (req, res) => {
  const { user } = req.session;
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/index');
  }
});

/* Ruta para la página de login */
app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/../client/login.html'));
});

/* Ruta para la página de registro */
app.get('/register', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/../client/login.html'));
});

/* Ruta para el login */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await UserHandle.login(username, password);
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set');
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    res
      .cookie('access_token', token, {
        httpsOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60
      })
      .send({ user });
  } catch (e) {
    res.status(401).send(e.message);
  }
});

/* Ruta para el registro */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const id = await UserHandle.create(username, password);
    res.send({ id });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

/* Ruta para el logout */
app.post('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .send('Logged out');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { db };