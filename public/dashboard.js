document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificación de Seguridad
    const token = localStorage.getItem('physioToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    let calendar;
    let activityChart;
    let userRole = "";

    // 2. Cargar Identidad del Usuario (Backend)
    const loadIdentity = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const user = await res.json();
                userRole = user.rol;
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
    const loadPatientsForSelects = async () => {
        try {
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const pacientes = data.filter(u => u.rol === 'paciente');

            const selects = [
                document.getElementById('facturaPacienteId'),
                document.getElementById('expedientePacienteId')
            ];

            selects.forEach(select => {
                if(!select) return;
                select.innerHTML = '<option value="">Seleccione paciente...</option>';
                pacientes.forEach(p => {
                    select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
                });
            });
        } catch (e) {
            console.error('Error al cargar pacientes para selects', e);
        }
    };

    const loadRecords = async () => {
        try {
            const res = await fetch('/api/records', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const records = await res.json();
            const tbody = document.querySelector('#tablaExpedientes tbody');
            tbody.innerHTML = '';

            if (records.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No hay expedientes registrados</td></tr>';
                return;
            }

            records.forEach(record => {
                tbody.innerHTML += `
                    <tr>
                        <td class="fw-medium">${record.paciente?.nombre || 'Desconocido'}</td>
                        <td class="text-muted">${record.fisio?.nombre || 'Desconocido'}</td>
                        <td><small>${record.diagnostico || '-'}</small></td>
                        <td><small>${record.tratamiento || '-'}</small></td>
                        <td><small>${record.evolucion || '-'}</small></td>
                        <td class="text-muted">${new Date(record.createdAt).toLocaleDateString()}</td>
                    </tr>
                `;
            });
        } catch (e) {
            console.error('Error al cargar expedientes', e);
        }
    };

    const loadBills = async () => {
        try {
            const res = await fetch('/api/bills', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const bills = await res.json();
            const tbody = document.querySelector('#tablaFacturas tbody');
            tbody.innerHTML = '';

            if (bills.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay facturas registradas</td></tr>';
                return;
            }

            bills.forEach(bill => {
                const estadoBadge = bill.estado === 'pagado' ? '<span class="badge bg-success-subtle text-success">Pagado</span>' : '<span class="badge bg-warning-subtle text-warning">Pendiente</span>';

                let actions = '';
                if (userRole !== 'paciente' && bill.estado === 'pendiente') {
                    actions = `<button class="btn btn-sm btn-outline-success" onclick="marcarFacturaPagada('${bill.id}')">Marcar Pagado</button>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-medium">${bill.paciente?.nombre || 'Desconocido'}</td>
                        <td class="fw-bold text-navy">€${parseFloat(bill.monto).toFixed(2)}</td>
                        <td>${estadoBadge}</td>
                        <td class="text-muted">${new Date(bill.fecha_emision).toLocaleDateString()}</td>
                        <td>${actions}</td>
                    </tr>
                `;
            });
        } catch (e) {
            console.error('Error al cargar facturas', e);
        }
    };

    window.marcarFacturaPagada = async (id) => {
        if (!confirm('¿Marcar esta factura como pagada?')) return;
        try {
            const res = await fetch(`/api/bills/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'pagado' })
            });
            if (res.ok) {
                loadBills();
                loadStats();
            } else {
                alert('Error al actualizar factura');
            }
        } catch (e) {
            console.error('Error', e);
        }
    };

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



    // Forms Billing and Records
    document.getElementById('formNuevaFactura')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const body = {
                paciente_id: document.getElementById('facturaPacienteId').value,
                monto: document.getElementById('facturaMonto').value,
                estado: document.getElementById('facturaEstado').value
            };
            const res = await fetch('/api/bills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const modalEl = document.getElementById('nuevaFacturaModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
                e.target.reset();
                loadBills();
                loadStats();
            } else {
                const data = await res.json();
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error de red al crear factura');
        }
    });

    document.getElementById('formNuevoExpediente')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const body = {
                paciente_id: document.getElementById('expedientePacienteId').value,
                diagnostico: document.getElementById('expedienteDiagnostico').value,
                tratamiento: document.getElementById('expedienteTratamiento').value,
                evolucion: document.getElementById('expedienteEvolucion').value
            };
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const modalEl = document.getElementById('nuevoExpedienteModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
                e.target.reset();
                loadRecords();
            } else {
                const data = await res.json();
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error de red al crear expediente');
        }
    });

    document.getElementById('btnNuevaFactura')?.addEventListener('click', () => {
        const modalEl = document.getElementById('nuevaFacturaModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
    });

    document.getElementById('btnNuevoExpediente')?.addEventListener('click', () => {
        const modalEl = document.getElementById('nuevoExpedienteModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
    });

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