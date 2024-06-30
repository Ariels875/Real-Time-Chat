import { UserHandle } from './userHandle.js';
import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.DB_TOKEN
});

async function handleRequest(request) {
  const url = new URL(request.url);
  let response;

  switch (url.pathname) {
    case '/login':
      if (request.method === 'POST') {
        response = await handleLogin(request);
      }
      break;
    case '/register':
      if (request.method === 'POST') {
        response = await handleRegister(request);
      }
      break;
    case '/logout':
      if (request.method === 'POST') {
        response = await handleLogout(request);
      }
      break;
    case '/username':
      response = await handleUsername(request);
      break;
    default:
      response = new Response('Not found', { status: 404 });
  }

  return response;
}

async function handleLogin(request) {
  const { username, password } = await request.json();
  try {
    const user = await UserHandle.login(username, password);
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set');
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    const headers = new Headers();
    headers.append('Set-Cookie', `access_token=${token}; HttpOnly; Max-Age=3600; Path=/; SameSite=Strict`);
    headers.append('Content-Type', 'application/json');

    return new Response(JSON.stringify({ user }), { headers });
  } catch (e) {
    return new Response(e.message, { status: 401 });
  }
}

async function handleRegister(request) {
  const { username, password } = await request.json();
  try {
    const id = await UserHandle.create(username, password);
    return new Response(JSON.stringify({ id }), { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}

async function handleLogout(request) {
  const headers = new Headers();
  headers.append('Set-Cookie', `access_token=; HttpOnly; Max-Age=0; Path=/; SameSite=Strict`);
  return new Response('Logged out', { headers });
}

async function handleUsername(request) {
  const cookie = request.headers.get('Cookie');
  const token = cookie?.match(/access_token=([^;]+)/)?.[1];
  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    return new Response(JSON.stringify({ username: data.username }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
