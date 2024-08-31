import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';
import { showToast } from './toast.js';

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

const getRandomColor = () => {
  const colors = ['rgb(139, 92, 246)', 'rgb(52, 211, 153)', 'rgb(251, 113, 133)', 'rgb(251, 191, 36)'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const init = async () => {
  const username = await getUsername();

  if (!username) {
    window.location.href = '/login';
    return;
  }

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
    const color = getRandomColor();
    const item = `
      <div class="flex items-start gap-3 mb-4" style="color: ${color};">
        <div class="rounded-full w-8 h-8 bg-[#8b5cf6] flex items-center justify-center text-sm font-bold">${username.charAt(0).toUpperCase()}</div>
        <div>
          <div class="font-bold">${username}</div>
          <div>${msg}</div>
        </div>
      </div>
    `;
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
      showToast('Cerrando sesión!', 'success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 700);
    } catch (error) {
      console.error('There was a problem with the logout operation:', error);
      showToast('Error al cerrar sesión: ' + error.message, 'error');
    }
  });
};

init();