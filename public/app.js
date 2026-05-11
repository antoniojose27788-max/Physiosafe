// app.js - Lógica del frontend para PhysioSafe usando Vanilla JavaScript

// Variables globales
const API_BASE_URL = 'http://localhost:3000/api'; // URL base de la API
let currentUser = null; // Usuario actualmente logueado
let authToken = null; // Token JWT almacenado

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginSection = document.getElementById('login-form');
const registerSection = document.getElementById('register-form');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const messageDiv = document.getElementById('message');

// Función para mostrar mensajes al usuario
function showMessage(message, type = 'success') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');

    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

// Función para alternar entre formularios de login y registro
function switchForm(showForm) {
    if (showForm === 'register') {
        loginSection.classList.remove('active');
        registerSection.classList.add('active');
    } else {
        registerSection.classList.remove('active');
        loginSection.classList.add('active');
    }
    // Limpiar mensajes previos
    messageDiv.classList.add('hidden');
}

// Función para hacer peticiones HTTP a la API
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Agregar token si existe
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        console.error('Error en API:', error);
        throw error;
    }
}

// Función para manejar el login
async function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    // Deshabilitar botón durante la petición
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });

        // Guardar token y usuario
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');

        // Redirigir al dashboard después de 1 segundo
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar Sesión';
    }
}

// Función para manejar el registro
async function handleRegister(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const registerData = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        password: formData.get('password'),
        rol: formData.get('rol')
    };

    // Deshabilitar botón durante la petición
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });

        showMessage('Registro exitoso. Ahora puedes iniciar sesión.', 'success');

        // Cambiar al formulario de login
        setTimeout(() => {
            switchForm('login');
        }, 2000);

    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarse';
    }
}

// Función para verificar si el usuario ya está logueado
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');

    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        // Si estamos en index.html y el usuario está logueado, redirigir al dashboard
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            window.location.href = 'dashboard.html';
        }
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    window.location.href = 'index.html';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar estado de autenticación al cargar la página
    checkAuthStatus();

    // Event listeners para navegación en landing page
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showAuthModal('login'));
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', () => showAuthModal('register'));
    }

    // Event listeners para navegación suave
    document.querySelectorAll('.main-nav a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });

    // Event listener para formulario de contacto
    if (contactForm) {
        contactForm.addEventListener('submit', handleContact);
    }

    // Event listeners para formularios de autenticación (si existen en la página)
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchForm('register');
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchForm('login');
        });
    }

    // Event listeners para modal de autenticación
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', closeAuthModalFunc);
    }
    if (authModal) {
        window.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModalFunc();
            }
        });
    }
});

// Exportar funciones para uso en otros archivos (si es necesario)
window.PhysioSafe = {
    apiRequest,
    showMessage,
    logout
};