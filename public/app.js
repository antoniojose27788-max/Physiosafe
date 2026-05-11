// app.js - Lógica del Frontend para PhysioSafe

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = null;

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners para formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Mostrar formulario de login por defecto
    showLoginForm();
});

// ============================================================
// FUNCIONES DE UTILIDAD
// ============================================================

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    container.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
}

async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || responseData.message || 'Error en la petición');
        }

        return responseData;
    } catch (error) {
        console.error('Error en API:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// ============================================================
// GESTIÓN DE FORMULARIOS
// ============================================================

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
}

function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function switchForm(form) {
    if (form === 'login') {
        showLoginForm();
    } else if (form === 'register') {
        showRegisterForm();
    }
}

// ============================================================
// AUTENTICACIÓN
// ============================================================

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';

    try {
        const response = await apiRequest('/auth/login', 'POST', {
            email,
            password
        });

        authToken = response.token;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(response.usuario));

        showNotification('¡Inicio de sesión exitoso! Redirigiendo...', 'success');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        showNotification('Error al iniciar sesión: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Iniciar Sesión';
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const nombre = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const rol = document.getElementById('registerRole').value;

    // Validar que se haya seleccionado un rol
    if (!rol) {
        showNotification('Por favor selecciona un tipo de usuario', 'error');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

    try {
        await apiRequest('/auth/register', 'POST', {
            nombre,
            email,
            password,
            rol
        });

        showNotification('¡Registro exitoso! Ahora puedes iniciar sesión.', 'success');

        // Limpiar formulario
        document.getElementById('registerForm').reset();

        // Cambiar a login
        setTimeout(() => {
            showLoginForm();
        }, 1500);

    } catch (error) {
        showNotification('Error al registrarse: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Registrarse';
    }
}

// ============================================================
// SCROLL SUAVE
// ============================================================

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const target = e.target.getAttribute('href');
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
});
