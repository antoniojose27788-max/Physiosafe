// dashboard.js - Lógica completa del dashboard de PhysioSafe

const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let authToken = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    await checkAuth();
    
    // Cargar datos iniciales
    await loadUserInfo();
    await loadStats();
    await loadAppointments();

    // Event listeners para navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Botones de acciones
    document.getElementById('newAppointmentBtn')?.addEventListener('click', showNewAppointmentForm);
    document.getElementById('newReportBtn')?.addEventListener('click', showNewReportForm);
    document.getElementById('prevMonth')?.addEventListener('click', previousMonth);
    document.getElementById('nextMonth')?.addEventListener('click', nextMonth);
});

// ============================================================
// AUTENTICACIÓN
// ============================================================

async function checkAuth() {
    authToken = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('currentUser');

    if (!authToken || !userJson) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(userJson);
}

async function logout() {
    try {
        await apiRequest('/auth/logout', 'POST');
    } catch (error) {
        console.error('Error en logout:', error);
    } finally {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ============================================================
// UTILIDADES
// ============================================================

async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

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

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    container.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
}

function showSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');

        // Cargar datos específicos de la sección
        if (section === 'appointments') {
            loadAppointments();
        } else if (section === 'calendar') {
            renderCalendar();
        } else if (section === 'reports') {
            loadReports();
        } else if (section === 'consents') {
            loadConsents();
        } else if (section === 'users' && currentUser.rol === 'admin') {
            loadUsers();
        }
    }

    // Actualizar nav activo
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
}

// ============================================================
// CARGA DE DATOS
// ============================================================

async function loadUserInfo() {
    try {
        const user = await apiRequest('/auth/me');
        document.getElementById('userName').textContent = user.nombre;
        document.getElementById('userRole').textContent = user.rol.toUpperCase();

        // Mostrar opciones según rol
        if (user.rol === 'admin') {
            const adminUsers = document.getElementById('adminUsers');
            if (adminUsers) adminUsers.style.display = 'block';
        }
    } catch (error) {
        console.error('Error cargando información del usuario:', error);
    }
}

async function loadStats() {
    try {
        const stats = await apiRequest('/stats');
        document.getElementById('totalAppointments').textContent = stats.totalAppointments || 0;
        document.getElementById('pendingAppointments').textContent = stats.pendingAppointments || 0;
        document.getElementById('totalReports').textContent = stats.totalReports || 0;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function loadAppointments() {
    try {
        const appointments = await apiRequest('/appointments');
        const container = document.getElementById('appointmentsList');

        if (!appointments || appointments.length === 0) {
            container.innerHTML = '<p class="text-center">No hay citas disponibles</p>';
            return;
        }

        container.innerHTML = appointments.map(apt => {
            const fecha = new Date(apt.fecha_hora);
            const estado = apt.estado === 'completada' ? 'success' : 'warning';
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="card-title">${apt.paciente?.nombre || 'Paciente'}</h5>
                                <p class="card-text">
                                    <small>📅 ${fecha.toLocaleDateString('es-ES')} a las ${fecha.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</small><br>
                                    <small>👨‍⚕️ ${apt.fisio?.nombre || 'Fisioterapeuta'}</small>
                                </p>
                            </div>
                            <span class="badge bg-${estado}">${apt.estado}</span>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-primary" onclick="editAppointment('${apt.id}')">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteAppointment('${apt.id}')">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error cargando citas:', error);
    }
}

async function loadReports() {
    try {
        const reports = await apiRequest('/reports');
        const container = document.getElementById('reportsList');

        if (!reports || reports.length === 0) {
            container.innerHTML = '<p class="text-center">No hay reportes disponibles</p>';
            return;
        }

        container.innerHTML = reports.map(report => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Paciente: ${report.paciente?.nombre || 'N/A'}</h5>
                    <p class="card-text">
                        <small class="text-muted">📅 ${new Date(report.createdAt).toLocaleDateString('es-ES')}</small><br>
                        ${report.descripcion}
                    </p>
                    ${report.archivo_url ? `<a href="${report.archivo_url}" target="_blank" class="btn btn-sm btn-primary">Ver archivo</a>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteReport('${report.id}')">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando reportes:', error);
    }
}

async function loadConsents() {
    try {
        const consents = await apiRequest('/consents');
        const container = document.getElementById('consents-section');

        if (!consents || consents.length === 0) {
            container.innerHTML = `
                <p class="text-center">No hay consentimientos registrados</p>
                <div class="text-center mt-3">
                    <button class="btn btn-primary" onclick="createNewConsent()">Crear Consentimiento</button>
                </div>
            `;
            return;
        }

        let html = '<div class="row">';
        consents.forEach(consent => {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <div class="text-center">
                                <h5 class="card-title">${consent.aceptado ? '✓ Aceptado' : '✗ Rechazado'}</h5>
                                <p class="card-text text-muted">
                                    ${new Date(consent.fecha_firma).toLocaleDateString('es-ES')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div><div class="text-center"><button class="btn btn-primary" onclick="createNewConsent()">Nuevo Consentimiento</button></div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando consentimientos:', error);
    }
}

async function loadUsers() {
    try {
        if (currentUser.rol !== 'admin') return;

        const users = await apiRequest('/users');
        const container = document.getElementById('users-section');

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Fecha Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.nombre}</td>
                                <td>${user.email}</td>
                                <td><span class="badge bg-info">${user.rol}</span></td>
                                <td>${new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// ============================================================
// CITAS
// ============================================================

function showNewAppointmentForm() {
    const html = `
        <div class="modal fade" id="appointmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nueva Cita</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="appointmentForm">
                            <div class="mb-3">
                                <label for="appointmentDateTime" class="form-label">Fecha y Hora</label>
                                <input type="datetime-local" id="appointmentDateTime" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="appointmentFisio" class="form-label">Fisioterapeuta (ID)</label>
                                <input type="text" id="appointmentFisio" class="form-control" placeholder="ID del Fisioterapeuta" required>
                            </div>
                            <div class="mb-3">
                                <label for="appointmentPaciente" class="form-label">Paciente (ID)</label>
                                <input type="text" id="appointmentPaciente" class="form-control" placeholder="ID del Paciente" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveNewAppointment()">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    modal.show();
}

async function saveNewAppointment() {
    try {
        const fechaHora = document.getElementById('appointmentDateTime').value;
        const fisioId = document.getElementById('appointmentFisio').value;
        const pacienteId = document.getElementById('appointmentPaciente').value;

        await apiRequest('/appointments', 'POST', {
            fecha_hora: new Date(fechaHora).toISOString(),
            fisio_id: fisioId,
            paciente_id: pacienteId
        });

        showNotification('Cita creada exitosamente', 'success');
        loadAppointments();
        
        bootstrap.Modal.getInstance(document.getElementById('appointmentModal')).hide();
        document.getElementById('appointmentModal').remove();
    } catch (error) {
        console.error('Error creando cita:', error);
    }
}

async function deleteAppointment(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
        try {
            await apiRequest(`/appointments/${id}`, 'DELETE');
            showNotification('Cita eliminada exitosamente', 'success');
            loadAppointments();
        } catch (error) {
            console.error('Error eliminando cita:', error);
        }
    }
}

// ============================================================
// CALENDARIO
// ============================================================

function renderCalendar() {
    const container = document.getElementById('calendar');
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    document.getElementById('calendarMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    let html = '<div class="row">';
    
    // Días de la semana
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayNames.forEach(day => {
        html += `<div class="col-2 text-center fw-bold">${day}</div>`;
    });

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="col-2"></div>';
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        html += `
            <div class="col-2 text-center p-2">
                <div class="btn btn-sm btn-outline-primary w-100" onclick="selectCalendarDay(${day})">
                    ${day}
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function selectCalendarDay(day) {
    const selectedDate = new Date(currentYear, currentMonth, day);
    showNotification(`Día seleccionado: ${selectedDate.toLocaleDateString('es-ES')}`, 'info');
}

// ============================================================
// REPORTES
// ============================================================

function showNewReportForm() {
    const html = `
        <div class="modal fade" id="reportModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nuevo Reporte</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="reportForm">
                            <div class="mb-3">
                                <label for="reportPaciente" class="form-label">Paciente (ID)</label>
                                <input type="text" id="reportPaciente" class="form-control" placeholder="ID del Paciente" required>
                            </div>
                            <div class="mb-3">
                                <label for="reportDescription" class="form-label">Descripción</label>
                                <textarea id="reportDescription" class="form-control" rows="5" placeholder="Describe el reporte aquí..." required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveNewReport()">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

async function saveNewReport() {
    try {
        const pacienteId = document.getElementById('reportPaciente').value;
        const descripcion = document.getElementById('reportDescription').value;

        await apiRequest('/reports', 'POST', {
            paciente_id: pacienteId,
            descripcion
        });

        showNotification('Reporte creado exitosamente', 'success');
        loadReports();
        
        bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
        document.getElementById('reportModal').remove();
    } catch (error) {
        console.error('Error creando reporte:', error);
    }
}

async function deleteReport(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
        try {
            showNotification('Reporte eliminado', 'success');
            loadReports();
        } catch (error) {
            console.error('Error eliminando reporte:', error);
        }
    }
}

// ============================================================
// CONSENTIMIENTOS
// ============================================================

async function createNewConsent() {
    try {
        const accepted = confirm('¿Aceptas los términos y condiciones?');
        
        await apiRequest('/consents', 'POST', {
            aceptado: accepted
        });

        showNotification('Consentimiento registrado exitosamente', 'success');
        loadConsents();
    } catch (error) {
        console.error('Error registrando consentimiento:', error);
    }
}
