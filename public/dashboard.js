// dashboard.js - Lógica específica del dashboard

// Variables globales
let currentSection = 'dashboard';
let currentCalendarDate = new Date();
let allAppointments = [];
let allReports = [];

// Elementos del DOM
const sidebarLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const logoutBtn = document.getElementById('logoutBtn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

// ========== SISTEMA DE NOTIFICACIONES ==========

function showNotification(message, type = 'success', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <span class="notification-close">&times;</span>
    `;

    container.appendChild(notification);

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });

    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// ========== NAVEGACIÓN ==========

function switchSection(sectionName) {
    contentSections.forEach(section => section.classList.remove('active'));
    sidebarLinks.forEach(link => link.classList.remove('active'));

    const targetSection = document.getElementById(`${sectionName}-section`);
    const targetLink = document.querySelector(`[data-section="${sectionName}"]`);

    if (targetSection) targetSection.classList.add('active');
    if (targetLink) targetLink.classList.add('active');

    currentSection = sectionName;
    loadSectionData(sectionName);
}

async function loadSectionData(section) {
    try {
        switch (section) {
            case 'dashboard':
                await loadDashboardStats();
                break;
            case 'appointments':
                await loadAppointments();
                break;
            case 'calendar':
                await renderCalendar();
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
        showNotification('Error cargando datos: ' + error.message, 'error');
    }
}

// ========== DASHBOARD ==========

async function loadDashboardStats() {
    try {
        const appointmentsData = await window.PhysioSafe.apiRequest('/appointments');
        const appointments = appointmentsData.appointments || [];
        document.getElementById('totalAppointments').textContent = appointments.length;
        document.getElementById('pendingAppointments').textContent =
            appointments.filter(app => app.estado === 'pendiente').length;

        const reportsData = await window.PhysioSafe.apiRequest('/reports');
        const reports = reportsData.reports || [];
        document.getElementById('totalReports').textContent = reports.length;

        const consentsData = await window.PhysioSafe.apiRequest('/consents');
        const consents = consentsData.consents || [];
        document.getElementById('totalConsents').textContent = consents.length;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// ========== CITAS ==========

async function loadAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = '<p>Cargando citas...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/appointments');
        allAppointments = data.appointments || [];

        if (allAppointments.length === 0) {
            appointmentsList.innerHTML = '<p>No hay citas registradas.</p>';
            return;
        }

        const html = allAppointments.map(app => `
            <div class="data-item">
                <div class="data-item-content">
                    <div class="data-item-title">Cita con ${app.fisio.nombre}</div>
                    <div class="data-item-subtitle">
                        <p><strong>Fecha:</strong> ${new Date(app.fecha_hora).toLocaleString()}</p>
                        <p><strong>Paciente:</strong> ${app.paciente.nombre}</p>
                        <p><strong>Estado:</strong> <span class="status ${app.estado}">${app.estado}</span></p>
                    </div>
                </div>
                <div class="data-item-actions">
                    ${window.currentUser.rol === 'fisio' ? `
                        <button class="btn btn-small btn-edit" onclick="editAppointmentModal(${app.id})">Editar</button>
                        <button class="btn btn-small btn-delete" onclick="deleteAppointment(${app.id})">Eliminar</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        appointmentsList.innerHTML = html;
    } catch (error) {
        appointmentsList.innerHTML = '<p>Error al cargar citas.</p>';
        console.error(error);
    }
}

// ========== CALENDARIO ==========

async function renderCalendar() {
    try {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        // Obtener citas del mes
        const data = await window.PhysioSafe.apiRequest(`/appointments/calendar/month?year=${year}&month=${month + 1}`);
        const appointments = data.appointments || [];

        // Calcular días del mes
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Headers de días
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        let calendarHTML = '<div class="calendar-grid">';

        // Agregar headers
        dayHeaders.forEach(header => {
            calendarHTML += `<div class="calendar-day-header">${header}</div>`;
        });

        // Agregar días vacíos del mes anterior
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day other-month"></div>';
        }

        // Agregar días del mes
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayAppointments = appointments.filter(app => {
                const appDate = new Date(app.fecha_hora).toISOString().split('T')[0];
                return appDate === dateStr;
            });

            const isToday = date.toDateString() === today.toDateString();
            const hasAppointments = dayAppointments.length > 0;

            let className = 'calendar-day';
            if (isToday) className += ' today';
            if (hasAppointments) className += ' has-appointments';

            calendarHTML += `
                <div class="${className}" onclick="selectCalendarDay('${dateStr}', ${hasAppointments})">
                    ${day}
                </div>
            `;
        }

        calendarHTML += '</div>';
        document.getElementById('calendar').innerHTML = calendarHTML;

        // Actualizar header del mes
        const monthName = new Date(year, month).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        document.getElementById('calendarMonth').textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        // Mostrar citas del día actual o primer día con citas
        if (today.getMonth() === month && today.getFullYear() === year) {
            selectCalendarDay(today.toISOString().split('T')[0], false);
        } else {
            const firstDayWithAppointments = appointments.length > 0 ? new Date(appointments[0].fecha_hora) : null;
            if (firstDayWithAppointments) {
                selectCalendarDay(firstDayWithAppointments.toISOString().split('T')[0], true);
            }
        }
    } catch (error) {
        console.error('Error renderizando calendario:', error);
        showNotification('Error al cargar calendario', 'error');
    }
}

async function selectCalendarDay(dateStr, hasAppointments) {
    const year = parseInt(dateStr.split('-')[0]);
    const month = parseInt(dateStr.split('-')[1]);
    const data = await window.PhysioSafe.apiRequest(`/appointments/calendar/month?year=${year}&month=${month}`);
    const appointments = data.appointments || [];

    const dayAppointments = appointments.filter(app => {
        const appDate = new Date(app.fecha_hora).toISOString().split('T')[0];
        return appDate === dateStr;
    });

    // Marcar día como seleccionado
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    document.querySelectorAll('.calendar-day').forEach(d => {
        const dayNum = d.textContent.trim();
        if (dayNum === dateStr.split('-')[2]) {
            d.classList.add('selected');
        }
    });

    // Mostrar citas del día
    const appointmentsContainer = document.getElementById('calendarAppointments');
    const date = new Date(dateStr);
    
    if (dayAppointments.length === 0) {
        appointmentsContainer.innerHTML = `
            <h3>Citas para ${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
            <p>No hay citas programadas para este día.</p>
        `;
    } else {
        const appointmentsHTML = dayAppointments.map(app => `
            <div class="appointment-item">
                <div class="appointment-info">
                    <div class="appointment-time">${new Date(app.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="appointment-people">
                        Paciente: ${app.paciente.nombre} | Fisio: ${app.fisio.nombre}
                    </div>
                    <div class="appointment-people">
                        Estado: <strong>${app.estado}</strong>
                    </div>
                </div>
                <div class="appointment-actions">
                    ${window.currentUser.rol === 'fisio' ? `
                        <button class="btn btn-small btn-edit" onclick="editAppointmentModal(${app.id})">Editar</button>
                        <button class="btn btn-small btn-delete" onclick="deleteAppointment(${app.id})">Eliminar</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        appointmentsContainer.innerHTML = `
            <h3>Citas para ${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
            <div>${appointmentsHTML}</div>
        `;
    }
}

// ========== FUNCIONES DE CITAS ==========

async function editAppointmentModal(appointmentId) {
    const appointment = allAppointments.find(a => a.id === appointmentId);
    if (!appointment) {
        showNotification('Cita no encontrada', 'error');
        return;
    }

    const dateValue = new Date(appointment.fecha_hora).toISOString().slice(0, 16);
    const form = `
        <h2>Editar Cita</h2>
        <div class="form-group">
            <label>Fecha y Hora:</label>
            <input type="datetime-local" id="appointmentDateTime" value="${dateValue}" required>
        </div>
        <div class="form-group">
            <label>Estado:</label>
            <select id="appointmentStatus" required>
                <option value="pendiente" ${appointment.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="confirmada" ${appointment.estado === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                <option value="completada" ${appointment.estado === 'completada' ? 'selected' : ''}>Completada</option>
                <option value="cancelada" ${appointment.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
            </select>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModalFunc()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="updateAppointment(${appointmentId})">Guardar</button>
        </div>
    `;
    openModal(form);
}

async function updateAppointment(appointmentId) {
    const fechaHora = document.getElementById('appointmentDateTime').value;
    const estado = document.getElementById('appointmentStatus').value;

    try {
        await window.PhysioSafe.apiRequest(`/appointments/${appointmentId}`, 'PUT', {
            fecha_hora: fechaHora,
            estado: estado
        });

        showNotification('Cita actualizada exitosamente', 'success');
        closeModalFunc();
        loadAppointments();
        await renderCalendar();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function deleteAppointment(appointmentId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
        try {
            await window.PhysioSafe.apiRequest(`/appointments/${appointmentId}`, 'DELETE');
            showNotification('Cita eliminada exitosamente', 'success');
            loadAppointments();
            await renderCalendar();
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    }
}
async function loadReports() {
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = '<p>Cargando reportes...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/reports');
        allReports = data.reports || [];

        if (allReports.length === 0) {
            reportsList.innerHTML = '<p>No hay reportes registrados.</p>';
            return;
        }

        const html = allReports.map(report => `
            <div class="data-item">
                <div class="data-item-content">
                    <div class="data-item-title">Reporte de ${report.fisio.nombre}</div>
                    <div class="data-item-subtitle">
                        <p><strong>Paciente:</strong> ${report.paciente.nombre}</p>
                        <p><strong>Descripción:</strong> ${report.descripcion}</p>
                        ${report.archivo_url ? `<p><strong>Archivo:</strong> <a href="${report.archivo_url}" target="_blank">Ver archivo</a></p>` : ''}
                    </div>
                </div>
                <div class="data-item-actions">
                    ${window.currentUser.rol === 'fisio' ? `
                        <button class="btn btn-small btn-edit" onclick="editReportModal(${report.id})">Editar</button>
                        <button class="btn btn-small btn-delete" onclick="deleteReport(${report.id})">Eliminar</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        reportsList.innerHTML = html;
    } catch (error) {
        reportsList.innerHTML = '<p>Error al cargar reportes.</p>';
        console.error(error);
    }
}

async function editReportModal(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) {
        showNotification('Reporte no encontrado', 'error');
        return;
    }

    const form = `
        <h2>Editar Reporte</h2>
        <div class="form-group">
            <label>Descripción:</label>
            <textarea id="reportDescription" required>${report.descripcion}</textarea>
        </div>
        <div class="form-group">
            <label>Archivo URL (opcional):</label>
            <input type="url" id="reportFileUrl" value="${report.archivo_url || ''}" placeholder="https://ejemplo.com/archivo.pdf">
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModalFunc()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="updateReport(${reportId})">Guardar</button>
        </div>
    `;
    openModal(form);
}

async function updateReport(reportId) {
    const descripcion = document.getElementById('reportDescription').value;
    const archivoUrl = document.getElementById('reportFileUrl').value;

    if (!descripcion) {
        showNotification('Por favor completa la descripción', 'warning');
        return;
    }

    try {
        await window.PhysioSafe.apiRequest(`/reports/${reportId}`, 'PUT', {
            descripcion,
            archivo_url: archivoUrl || null
        });

        showNotification('Reporte actualizado exitosamente', 'success');
        closeModalFunc();
        loadReports();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function deleteReport(reportId) {
    if (confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
        try {
            await window.PhysioSafe.apiRequest(`/reports/${reportId}`, 'DELETE');
            showNotification('Reporte eliminado exitosamente', 'success');
            loadReports();
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    }
}

// ========== CONSENTIMIENTOS ==========

// Función para cargar consentimientos
async function loadConsents() {
    const consentsList = document.getElementById('consentsList');
    consentsList.innerHTML = '<p>Cargando consentimientos...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/consents');
        const consents = data.consents || [];

        if (consents.length === 0) {
            consentsList.innerHTML = `
                <p>No has firmado el consentimiento informado. Debes hacerlo para usar la plataforma.</p>
                <button class="btn btn-primary" onclick="showNewConsentModal()">Firmar Consentimiento</button>
            `;
            return;
        }

        const html = consents.map(consent => `
            <div class="data-item">
                <div class="data-item-content">
                    <div class="data-item-title">Consentimiento ${consent.aceptado ? '✓ Aceptado' : '⚠ Pendiente'}</div>
                    <div class="data-item-subtitle">
                        <p><strong>Fecha de firma:</strong> ${new Date(consent.fecha_firma).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `).join('');

        consentsList.innerHTML = html;
    } catch (error) {
        consentsList.innerHTML = '<p>Error al cargar consentimientos.</p>';
        console.error(error);
    }
}

// ========== USUARIOS ==========

// Función para cargar usuarios (solo admin)
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<p>Cargando usuarios...</p>';

    try {
        const data = await window.PhysioSafe.apiRequest('/users');
        const users = data.usuarios || [];

        const html = users.map(user => `
            <div class="data-item">
                <div class="data-item-content">
                    <div class="data-item-title">${user.nombre}</div>
                    <div class="data-item-subtitle">
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Rol:</strong> <span class="role-badge">${user.rol}</span></p>
                    </div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-small btn-delete" onclick="deleteUser(${user.id})">Eliminar</button>
                </div>
            </div>
        `).join('');

        usersList.innerHTML = html;
    } catch (error) {
        usersList.innerHTML = '<p>Error al cargar usuarios.</p>';
        console.error(error);
    }
}

async function deleteUser(userId) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
        try {
            await window.PhysioSafe.apiRequest(`/users/${userId}`, 'DELETE');
            showNotification('Usuario eliminado exitosamente', 'success');
            loadUsers();
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    }
}

// ========== MODALES - CITAS ==========

function showNewAppointmentModal() {
    const form = `
        <h2>Nueva Cita</h2>
        <div class="form-group">
            <label>Fecha y Hora:</label>
            <input type="datetime-local" id="appointmentDateTime" required>
        </div>
        <div class="form-group">
            <label>Paciente:</label>
            <select id="appointmentPatient" required>
                <option value="">Seleccionar paciente...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Fisioterapeuta:</label>
            <select id="appointmentFisio" required>
                <option value="">Seleccionar fisioterapeuta...</option>
            </select>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModalFunc()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="createAppointment()">Guardar</button>
        </div>
    `;
    openModal(form);

    // Cargar pacientes y fisios
    window.PhysioSafe.apiRequest('/users').then(data => {
        const users = data.usuarios || [];
        const patientSelect = document.getElementById('appointmentPatient');
        const fisioSelect = document.getElementById('appointmentFisio');

        users.filter(u => u.rol === 'paciente').forEach(user => {
            patientSelect.innerHTML += `<option value="${user.id}">${user.nombre}</option>`;
        });

        users.filter(u => u.rol === 'fisio').forEach(user => {
            fisioSelect.innerHTML += `<option value="${user.id}">${user.nombre}</option>`;
        });
    });
}

async function createAppointment() {
    const fechaHora = document.getElementById('appointmentDateTime').value;
    const pacienteId = document.getElementById('appointmentPatient').value;
    const fisioId = document.getElementById('appointmentFisio').value;

    if (!fechaHora || !pacienteId || !fisioId) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }

    try {
        await window.PhysioSafe.apiRequest('/appointments', 'POST', {
            fecha_hora: fechaHora,
            paciente_id: pacienteId,
            fisio_id: fisioId
        });

        showNotification('Cita creada exitosamente', 'success');
        closeModalFunc();
        loadAppointments();
        await renderCalendar();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// ========== MODALES - REPORTES ==========

function showNewReportModal() {
    const form = `
        <h2>Nuevo Reporte</h2>
        <div class="form-group">
            <label>Descripción:</label>
            <textarea id="reportDescription" required></textarea>
        </div>
        <div class="form-group">
            <label>Paciente:</label>
            <select id="reportPatient" required>
                <option value="">Seleccionar paciente...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Archivo URL (opcional):</label>
            <input type="url" id="reportFileUrl" placeholder="https://ejemplo.com/archivo.pdf">
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModalFunc()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="createReport()">Guardar</button>
        </div>
    `;
    openModal(form);

    // Cargar pacientes
    window.PhysioSafe.apiRequest('/users').then(data => {
        const users = data.usuarios || [];
        const patientSelect = document.getElementById('reportPatient');

        users.filter(u => u.rol === 'paciente').forEach(user => {
            patientSelect.innerHTML += `<option value="${user.id}">${user.nombre}</option>`;
        });
    });
}

async function createReport() {
    const descripcion = document.getElementById('reportDescription').value;
    const pacienteId = document.getElementById('reportPatient').value;
    const archivoUrl = document.getElementById('reportFileUrl').value;
    const fisioId = window.currentUser.id;

    if (!descripcion || !pacienteId) {
        showNotification('Por favor completa los campos requeridos', 'warning');
        return;
    }

    try {
        await window.PhysioSafe.apiRequest('/reports', 'POST', {
            descripcion,
            paciente_id: pacienteId,
            fisio_id: fisioId,
            archivo_url: archivoUrl || null
        });

        showNotification('Reporte creado exitosamente', 'success');
        closeModalFunc();
        loadReports();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// ========== MODALES - CONSENTIMIENTOS ==========

function showNewConsentModal() {
    const form = `
        <h2>Consentimiento Informado</h2>
        <div class="consent-text">
            <h3>Términos y Condiciones de PhysioSafe</h3>
            <ul>
                <li>Acepto participar voluntariamente en los tratamientos de fisioterapia propuestos.</li>
                <li>He sido informado de los procedimientos, riesgos y beneficios del tratamiento.</li>
                <li>Autorizo al personal médico y de fisioterapia a acceder a mi información de salud.</li>
                <li>He leído y entiendo los términos de privacidad y protección de datos.</li>
                <li>Acepto recibir comunicaciones sobre mi tratamiento y progreso.</li>
            </ul>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="consentCheckbox" required>
                Acepto los términos y condiciones
            </label>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModalFunc()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="createConsent()">Firmar Consentimiento</button>
        </div>
    `;
    openModal(form);
}

async function createConsent() {
    const checkbox = document.getElementById('consentCheckbox');
    if (!checkbox.checked) {
        showNotification('Debes aceptar el consentimiento', 'warning');
        return;
    }

    try {
        await window.PhysioSafe.apiRequest('/consents', 'POST', {
            aceptado: true
        });

        showNotification('Consentimiento firmado exitosamente', 'success');
        closeModalFunc();
        loadConsents();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// ========== MODALES - USUARIOS ==========

function showNewUserModal() {
    const form = `
        <h2>Nuevo Usuario</h2>
        <div class="form-group">
            <label>Nombre:</label>
            <input type="text" id="userName" required>
        </div>
        <div class="form-group">
            <label>Email:</label>
            <input type="email" id="userEmail" required>
        </div>
        <div class="form-group">
            <label>Contraseña:</label>
            <input type="password" id="userPassword" required>
        </div>
        <div class="form-group">
            <label>Rol:</label>
            <select id="userRole" required>
                <option value="paciente">Paciente</option>
                <option value="fisio">Fisioterapeuta</option>
                <option value="admin">Administrador</option>
            </select>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModalFunc()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="createUser()">Crear Usuario</button>
        </div>
    `;
    openModal(form);
}

async function createUser() {
    const nombre = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const rol = document.getElementById('userRole').value;

    if (!nombre || !email || !password || !rol) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }

    try {
        await window.PhysioSafe.apiRequest('/users', 'POST', {
            nombre,
            email,
            password,
            rol
        });

        showNotification('Usuario creado exitosamente', 'success');
        closeModalFunc();
        loadUsers();
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// ========== MODAL UTILITIES ==========

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
    document.getElementById('newAppointmentBtn')?.addEventListener('click', showNewAppointmentModal);
    document.getElementById('newReportBtn')?.addEventListener('click', showNewReportModal);
    document.getElementById('newConsentBtn')?.addEventListener('click', showNewConsentModal);
    document.getElementById('newUserBtn')?.addEventListener('click', showNewUserModal);

    // Calendario
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
});