import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';
import { showToast } from './toast.js';

/* Función para obtener el nombre de usuario */
const getUsername = async () => {
  try {
    const response = await fetch('/username');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.username;
  } catch (error) {
    console.error('Error fetching username:', error);
    return null;
  }
};

/* Verificar si el usuario está loggeado */
const init = async () => {
  const username = await getUsername();

  if (!username) {
    /* Redirigir al usuario a la página de login si no está autenticado */
    window.location.href = '/login';
    return;
  }

  /* Conectar el socket si el usuario está autenticado */
  const socket = io({
    auth: {
      username,
      serverOffset: 0,
    },
  });

  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const messages = document.getElementById('messages');
  const logoutBtn = document.getElementById('logout-btn');
  
  socket.on('chat message', (msg, serverOffset, username) => {
    const item = `<li>
      <p>${msg}</p>
      <small>${username}</small>
    </li>`;
    messages.insertAdjacentHTML('beforeend', item);
    socket.auth.serverOffset = serverOffset;
    messages.scrollTop = messages.scrollHeight;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      showToast('Logged in successfully', 'success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000); /* Espera 1 segundo antes de redirigir */
    } catch (error) {
      console.error('There was a problem with the logout operation:', error);
      showToast('Error al cerrar sesión: ' + error.message, 'error');
    }
  });

};

/* Inicializar la aplicación del cliente */
init();
