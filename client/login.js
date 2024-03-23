// Función para realizar el inicio de sesión
async function login(username, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            setCookie("token", data.token, 1); // Almacena el token de sesión por un día
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return false;
    }
}

// Función para verificar si el usuario está autenticado
async function isAuthenticated() {
    const token = getCookie("token");
    if (!token) return false;

    try {
        const response = await fetch('/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        return false;
    }
}

// Función para cerrar sesión
function logout() {
    eraseCookie("token");
}

// Función para establecer una cookie
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Función para obtener el valor de una cookie
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Función para eliminar una cookie
function eraseCookie(name) {   
    document.cookie = name + '=; Max-Age=-99999999;';  
}
