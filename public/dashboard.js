document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificación de Seguridad
    const token = localStorage.getItem('physioToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    let calendar;
    let activityChart;

    // 2. Cargar Identidad del Usuario (Backend)
    const loadIdentity = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const user = await res.json();
                document.getElementById('userNameHeader').innerText = user.nombre;
                document.getElementById('userRoleHeader').innerText = user.rol === 'paciente' ? 'Paciente Registrado' : 'Administrador';
                document.getElementById('userAvatar').innerText = user.nombre.charAt(0).toUpperCase();
            } else {
                throw new Error("Token caducado");
            }
        } catch (error) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    };

    // 3. Inicializar Gráfico de Actividad (Chart.js)
    const initChart = () => {
        const ctx = document.getElementById('activityChart').getContext('2d');
        activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                datasets: [{
                    label: 'Citas Realizadas',
                    data: [2, 4, 1, 5, 3, 2], // Datos visuales de prueba para el SaaS
                    backgroundColor: '#4f46e5',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    // 4. Cargar Citas (Tabla y Calendario)
    const loadAppointments = async () => {
        try {
            const res = await fetch('/api/appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const citas = await res.json();
            
            const tbody = document.getElementById('tableAppointments');
            tbody.innerHTML = '';
            const calendarEvents = [];
            let pendientes = 0;

            citas.forEach(cita => {
                if(cita.estado === 'pendiente') pendientes++;

                // Formatear tabla
                tbody.innerHTML += `
                    <tr>
                        <td>
                            <div class="fw-bold text-dark">${cita.motivo || 'Consulta General'}</div>
                            <small class="text-muted text-truncate d-inline-block" style="max-width: 200px;">${cita.observaciones || 'Sin notas'}</small>
                        </td>
                        <td>
                            <div class="fw-semibold">${new Date(cita.fecha_hora).toLocaleDateString('es-ES')}</div>
                            <small class="text-muted">${new Date(cita.fecha_hora).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</small>
                        </td>
                        <td><span class="badge-soft badge-soft-primary">Pendiente</span></td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-light text-danger border shadow-sm" onclick="deleteCita('${cita.id}')" title="Cancelar Cita">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </td>
                    </tr>
                `;

                // Añadir evento al calendario
                calendarEvents.push({
                    title: cita.motivo,
                    start: cita.fecha_hora,
                    backgroundColor: '#4f46e5',
                    borderColor: '#4f46e5',
                    extendedProps: { observaciones: cita.observaciones }
                });
            });

            // Actualizar KPIs
            document.getElementById('kpiCitas').innerText = citas.length;
            document.getElementById('kpiPendientes').innerText = pendientes;

            // Actualizar Calendario si existe
            if (calendar) {
                calendar.removeAllEvents();
                calendar.addEventSource(calendarEvents);
            }

        } catch (error) {
            console.error("Error al cargar citas:", error);
        }
    };

    // 5. Inicializar FullCalendar
    const initCalendar = () => {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'es',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek'
                },
                events: [] // Se llena en loadAppointments
            });
            calendar.render();
        }
    };

    // 6. Manejo del Formulario de Nueva Cita
    document.getElementById('formCita').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Efecto visual de carga
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        btnSubmit.disabled = true;

        const body = {
            motivo: document.getElementById('citaMotivo').value,
            fecha_hora: document.getElementById('citaFecha').value,
            observaciones: document.getElementById('citaObservaciones').value
        };

        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                // Limpiar formulario y cerrar modal
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('modalCita')).hide();
                loadAppointments(); // Recargar datos
            } else {
                alert("Error al agendar la cita.");
            }
        } finally {
            btnSubmit.innerHTML = 'Confirmar Cita';
            btnSubmit.disabled = false;
        }
    });

    // 7. Sistema de Pestañas (SPA Navigation)
    document.querySelectorAll('.nav-item[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Evitar clic en secciones deshabilitadas (Pro)
            if (e.currentTarget.classList.contains('disabled')) return;

            // Cambiar clase activa en menú
            document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Mostrar sección correspondiente
            const target = e.currentTarget.dataset.target;
            document.querySelectorAll('.spa-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${target}-section`).classList.add('active');

            // Si es calendario, forzar renderizado por si la ventana cambió de tamaño
            if (target === 'calendar' && calendar) {
                setTimeout(() => calendar.render(), 100);
            }
        });
    });

    // 8. Borrar Cita (Función Global)
    window.deleteCita = async (id) => {
        if (!confirm("¿Estás seguro de cancelar esta cita clínica?")) return;
        
        const res = await fetch(`/api/appointments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            loadAppointments();
        }
    };

    // 9. Cerrar Sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // EJECUCIÓN INICIAL
    await loadIdentity();
    initChart();
    initCalendar();
    await loadAppointments();
});