// dashboard.js - Lógica específica del dashboard

// Variables globales para el dashboard
let currentSection = 'dashboard';

// Elementos del DOM
const sidebarLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const logoutBtn = document.getElementById('logoutBtn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');
const dashboardMessage = document.getElementById('dashboardMessage');

// Función para cambiar de sección
function switchSection(sectionName) {
    // Ocultar todas las secciones
    contentSections.forEach(section => section.classList.remove('active'));
    sidebarLinks.forEach(link => link.classList.remove('active'));

    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(`${sectionName}-section`);
    const targetLink = document.querySelector(`[data-section="${sectionName}"]`);

    if (targetSection) {
        targetSection.classList.add('active');
    }
    if (targetLink) {
        targetLink.classList.add('active');
    }

    currentSection = sectionName;

    // Cargar datos de la sección
    loadSectionData(sectionName);
}

// Función para cargar datos de una sección
async function loadSectionData(section) {
    try {
        switch (section) {
            case 'dashboard':
                await loadDashboardStats();
                break;
            case 'appointments':
                await loadAppointments();
                break;
            case 'reports':
                await loadReports();
                break;
            case 'consents':
                await loadConsents();
                break;
            case 'users':
                await loadUsers();
                break;
        }
    } catch (error) {
        showDashboardMessage(error.message, 'error');
    }
}

// Función para cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        // Cargar citas
        const appointmentsData = await window.PhysioSafe.apiRequest('/appointments');
        const appointments = appointmentsData.appointments || [];
        document.getElementById('totalAppointments').textContent = appointments.length;
        document.getElementById('pendingAppointments').textContent =
            appointments.filter(app => app.estado === 'pendiente').length;

        // Cargar reportes
        const reportsData = await window.PhysioSafe.apiRequest('/reports');
        const reports = reportsData.reports || [];
        document.getElementById('totalReports').textContent = reports.length;

        // Cargar consentimientos
        const consentsData = await window.PhysioSafe.apiRequest('/consents');
        const consents = consentsData.consents || [];
        document.getElementById('totalConsents').textContent = consents.length;

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Función para cargar citas
async function loadAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = '<p>Cargando citas...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/appointments');
        const appointments = data.appointments || [];

        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<p>No hay citas registradas.</p>';
            return;
        }

        const html = appointments.map(appointment => `
            <div class="data-item">
                <h4>Cita con ${appointment.fisio.nombre}</h4>
                <p><strong>Fecha:</strong> ${new Date(appointment.fecha_hora).toLocaleString()}</p>
                <p><strong>Estado:</strong> <span class="status ${appointment.estado}">${appointment.estado}</span></p>
                <p><strong>Paciente:</strong> ${appointment.paciente.nombre}</p>
            </div>
        `).join('');

        appointmentsList.innerHTML = html;
    } catch (error) {
        appointmentsList.innerHTML = '<p>Error al cargar citas.</p>';
    }
}

// Función para cargar reportes
async function loadReports() {
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = '<p>Cargando reportes...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/reports');
        const reports = data.reports || [];

        if (reports.length === 0) {
            reportsList.innerHTML = '<p>No hay reportes registrados.</p>';
            return;
        }

        const html = reports.map(report => `
            <div class="data-item">
                <h4>Reporte de ${report.fisio.nombre}</h4>
                <p><strong>Paciente:</strong> ${report.paciente.nombre}</p>
                <p><strong>Descripción:</strong> ${report.descripcion}</p>
                ${report.archivo_url ? `<p><strong>Archivo:</strong> <a href="${report.archivo_url}" target="_blank">Ver archivo</a></p>` : ''}
            </div>
        `).join('');

        reportsList.innerHTML = html;
    } catch (error) {
        reportsList.innerHTML = '<p>Error al cargar reportes.</p>';
    }
}

// Función para cargar consentimientos
async function loadConsents() {
    const consentsList = document.getElementById('consentsList');
    consentsList.innerHTML = '<p>Cargando consentimientos...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/consents');
        const consents = data.consents || [];

        if (consents.length === 0) {
            consentsList.innerHTML = '<p>No hay consentimientos registrados.</p>';
            return;
        }

        const html = consents.map(consent => `
            <div class="data-item">
                <h4>Consentimiento ${consent.aceptado ? 'Aceptado' : 'Pendiente'}</h4>
                <p><strong>Fecha de firma:</strong> ${new Date(consent.fecha_firma).toLocaleString()}</p>
            </div>
        `).join('');

        consentsList.innerHTML = html;
    } catch (error) {
        consentsList.innerHTML = '<p>Error al cargar consentimientos.</p>';
    }
}

// Función para cargar usuarios (solo admin)
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<p>Cargando usuarios...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/users');
        const users = data.usuarios || [];

        const html = users.map(user => `
            <div class="data-item">
                <h4>${user.nombre}</h4>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Rol:</strong> <span class="role-badge">${user.rol}</span></p>
            </div>
        `).join('');

        usersList.innerHTML = html;
    } catch (error) {
        usersList.innerHTML = '<p>Error al cargar usuarios.</p>';
    }
}

// Función para mostrar mensajes en el dashboard
function showDashboardMessage(message, type = 'success') {
    dashboardMessage.textContent = message;
    dashboardMessage.className = `message ${type}`;
    dashboardMessage.classList.remove('hidden');

    setTimeout(() => {
        dashboardMessage.classList.add('hidden');
    }, 5000);
}

// Función para abrir modal
function openModal(content) {
    modalBody.innerHTML = content;
    modal.classList.remove('hidden');
}

// Función para cerrar modal
function closeModalFunc() {
    modal.classList.add('hidden');
    modalBody.innerHTML = '';
}

// Función para inicializar el dashboard
function initDashboard() {
    // Verificar autenticación
    if (!window.currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Mostrar información del usuario
    document.getElementById('userName').textContent = window.currentUser.nombre;
    document.getElementById('userRole').textContent = window.currentUser.rol;

    // Mostrar menú de admin si es admin
    if (window.currentUser.rol === 'admin') {
        document.getElementById('adminUsers').style.display = 'block';
    }

    // Cargar datos iniciales
    loadSectionData('dashboard');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();

    // Navegación por sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            switchSection(section);
        });
    });

    // Cerrar sesión
    logoutBtn.addEventListener('click', () => {
        window.PhysioSafe.logout();
    });

    // Modal
    closeModal.addEventListener('click', closeModalFunc);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalFunc();
        }
    });

    // Botones de acción
    document.getElementById('newAppointmentBtn').addEventListener('click', showNewAppointmentModal);
    document.getElementById('newReportBtn').addEventListener('click', showNewReportModal);
    document.getElementById('newConsentBtn').addEventListener('click', showNewConsentModal);
    document.getElementById('newUserBtn').addEventListener('click', showNewUserModal);
});