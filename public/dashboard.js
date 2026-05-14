document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('physioToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    let calendar;
    let activityChart;
    let currentUser = null;

    const isStaff = () => currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'fisio');

    const fmtMoney = (n) =>
        `${Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

    const badgeEstado = (estado) => {
        if (estado === 'completada') {
            return '<span class="badge bg-success-subtle text-success border border-success-subtle">Completada</span>';
        }
        return '<span class="badge bg-warning-subtle text-warning border border-warning-subtle">Pendiente</span>';
    };

    const loadIdentity = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Token caducado');
            currentUser = await res.json();
            document.getElementById('userNameHeader').innerText = currentUser.nombre;
            const roleLabel =
                currentUser.rol === 'paciente'
                    ? 'Paciente'
                    : currentUser.rol === 'fisio'
                      ? 'Fisioterapeuta'
                      : 'Administrador';
            document.getElementById('userRoleHeader').innerText = roleLabel;
            document.getElementById('userAvatar').innerText = currentUser.nombre.charAt(0).toUpperCase();

            if (isStaff()) {
                document.getElementById('thPaciente').classList.remove('d-none');
                document.getElementById('btnNuevaFactura').classList.remove('d-none');
                document.getElementById('btnNuevoExpediente').classList.remove('d-none');
                document.getElementById('wrapCitaPaciente').classList.remove('d-none');
                document.getElementById('wrapCitaFisio').classList.remove('d-none');
            } else {
                document.getElementById('wrapCitaFisio').classList.remove('d-none');
                document.getElementById('patientsPacienteMsg').classList.remove('d-none');
            }
        } catch {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    };

    const loadPhysios = async () => {
        const sel = document.getElementById('citaFisioId');
        if (!sel) return;
        sel.innerHTML = '';
        try {
            const res = await fetch('/api/physios', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const list = await res.json();
            list.forEach((p) => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nombre;
                sel.appendChild(opt);
            });
            if (currentUser?.rol === 'fisio') {
                sel.value = currentUser.id;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadPatients = async () => {
        if (!isStaff()) return [];
        try {
            const res = await fetch('/api/patients', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    const fillPatientSelects = (patients) => {
        const ids = ['citaPacienteId', 'billPacienteId', 'recordPacienteId'];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = '';
            patients.forEach((p) => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.nombre} (${p.email})`;
                el.appendChild(opt);
            });
        });
    };

    const loadStats = async () => {
        try {
            const res = await fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const s = await res.json();
            document.getElementById('kpiCitas').innerText = s.totalAppointments ?? 0;
            document.getElementById('kpiPendientes').innerText = s.pendingAppointments ?? 0;
            document.getElementById('kpiIngresos').innerText = fmtMoney(s.ingresosCobrados);
            document.getElementById('kpiPendienteCobro').innerText = fmtMoney(s.pendienteCobro);

            if (activityChart) {
                const pend = s.pendingAppointments ?? 0;
                const done = s.completedAppointments ?? 0;
                activityChart.data.datasets[0].data = [pend, done, s.totalAppointments ?? 0, 0, 0, 0];
                activityChart.data.labels = ['Pendientes', 'Completadas', 'Total', '', '', ''];
                activityChart.update();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const initChart = () => {
        const ctx = document.getElementById('activityChart').getContext('2d');
        activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Pendientes', 'Completadas', 'Total', '', '', ''],
                datasets: [
                    {
                        label: 'Citas',
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: '#4f46e5',
                        borderRadius: 6
                    }
                ]
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

    const loadAppointments = async () => {
        try {
            const res = await fetch('/api/appointments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const citas = await res.json();

            const tbody = document.getElementById('tableAppointments');
            tbody.innerHTML = '';
            const calendarEvents = [];

            citas.forEach((cita) => {
                const staffCols = isStaff()
                    ? `<td><div class="fw-semibold">${cita.paciente?.nombre || '—'}</div><small class="text-muted">${cita.paciente?.email || ''}</small></td>`
                    : '';

                tbody.innerHTML += `
                    <tr>
                        ${staffCols}
                        <td>
                            <div class="fw-bold text-dark">${cita.motivo || 'Consulta general'}</div>
                            <small class="text-muted text-truncate d-inline-block" style="max-width: 220px;">${cita.observaciones || 'Sin notas'}</small>
                        </td>
                        <td>
                            <div class="fw-semibold">${new Date(cita.fecha_hora).toLocaleDateString('es-ES')}</div>
                            <small class="text-muted">${new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
                        </td>
                        <td>${badgeEstado(cita.estado)}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-light text-danger border shadow-sm" onclick="deleteCita('${cita.id}')" title="Cancelar cita">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </td>
                    </tr>
                `;

                const title = isStaff()
                    ? `${cita.motivo || 'Cita'} — ${cita.paciente?.nombre || ''}`
                    : cita.motivo || 'Cita';
                calendarEvents.push({
                    title,
                    start: cita.fecha_hora,
                    backgroundColor: cita.estado === 'completada' ? '#16a34a' : '#4f46e5',
                    borderColor: cita.estado === 'completada' ? '#16a34a' : '#4f46e5',
                    extendedProps: { observaciones: cita.observaciones }
                });
            });

            if (calendar) {
                calendar.removeAllEvents();
                calendar.addEventSource(calendarEvents);
            }
        } catch (error) {
            console.error('Error al cargar citas:', error);
        }
    };

    const loadPatientsTable = async () => {
        const tbody = document.getElementById('tablePatients');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!isStaff()) return;
        const patients = await loadPatients();
        patients.forEach((p) => {
            tbody.innerHTML += `
                <tr>
                    <td class="fw-semibold">${p.nombre}</td>
                    <td>${p.email}</td>
                    <td>${new Date(p.createdAt).toLocaleDateString('es-ES')}</td>
                </tr>`;
        });
    };

    const loadBills = async () => {
        const tbody = document.getElementById('tableBills');
        if (!tbody) return;
        tbody.innerHTML = '';
        try {
            const res = await fetch('/api/bills', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const bills = await res.json();
            bills.forEach((b) => {
                const acciones = isStaff()
                    ? `<button class="btn btn-sm btn-outline-success me-1" onclick="marcarFacturaPagada('${b.id}')" ${b.estado === 'pagada' ? 'disabled' : ''}>Marcar pagada</button>
                       <button class="btn btn-sm btn-outline-secondary" onclick="anularFactura('${b.id}')" ${b.estado === 'anulada' ? 'disabled' : ''}>Anular</button>`
                    : '';
                tbody.innerHTML += `
                    <tr>
                        <td class="fw-semibold">${b.numero_factura}</td>
                        <td>${b.paciente?.nombre || '—'}</td>
                        <td>${fmtMoney(b.monto)}</td>
                        <td><span class="badge bg-light text-dark border">${b.estado}</span></td>
                        <td class="text-end">${acciones}</td>
                    </tr>`;
            });
        } catch (e) {
            console.error(e);
        }
    };

    const loadRecords = async () => {
        const tbody = document.getElementById('tableRecords');
        if (!tbody) return;
        tbody.innerHTML = '';
        try {
            const res = await fetch('/api/records', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const records = await res.json();
            records.forEach((r) => {
                const snippet = [r.diagnostico, r.tratamientos, r.evolucion]
                    .filter(Boolean)
                    .join(' · ')
                    .slice(0, 120);
                tbody.innerHTML += `
                    <tr>
                        <td>${new Date(r.createdAt).toLocaleString('es-ES')}</td>
                        <td>${r.paciente?.nombre || '—'}</td>
                        <td>${r.fisio?.nombre || '—'}</td>
                        <td><small class="text-muted">${snippet || '—'}</small></td>
                        <td class="text-end"></td>
                    </tr>`;
            });
        } catch (e) {
            console.error(e);
        }
    };

    const initCalendar = () => {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            events: []
        });
        calendar.render();
    };

    document.getElementById('formCita').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        btnSubmit.disabled = true;

        const motivo = document.getElementById('citaMotivo').value;
        const fecha_hora = document.getElementById('citaFecha').value;
        const observaciones = document.getElementById('citaObservaciones').value;

        const body = { motivo, fecha_hora, observaciones };

        if (isStaff()) {
            body.paciente_id = document.getElementById('citaPacienteId').value;
            body.fisio_id = document.getElementById('citaFisioId').value;
        } else {
            body.fisio_id = document.getElementById('citaFisioId').value;
        }

        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('modalCita')).hide();
                await loadAppointments();
                await loadStats();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.error || 'Error al agendar la cita.');
            }
        } finally {
            btnSubmit.innerHTML = 'Confirmar Cita';
            btnSubmit.disabled = false;
        }
    });

    document.getElementById('formBill').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isStaff()) return;
        const body = {
            paciente_id: document.getElementById('billPacienteId').value,
            monto: document.getElementById('billMonto').value,
            concepto: document.getElementById('billConcepto').value
        };
        const res = await fetch('/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById('modalBill')).hide();
            await loadBills();
            await loadStats();
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Error al crear factura');
        }
    });

    document.getElementById('formRecord').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isStaff()) return;
        const body = {
            paciente_id: document.getElementById('recordPacienteId').value,
            diagnostico: document.getElementById('recordDiagnostico').value,
            tratamientos: document.getElementById('recordTratamientos').value,
            evolucion: document.getElementById('recordEvolucion').value
        };
        const res = await fetch('/api/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById('modalRecord')).hide();
            await loadRecords();
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Error al guardar expediente');
        }
    });

    document.querySelectorAll('.nav-item[data-target]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach((l) => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const target = e.currentTarget.dataset.target;
            document.querySelectorAll('.spa-section').forEach((s) => s.classList.remove('active'));
            const section = document.getElementById(`${target}-section`);
            if (section) section.classList.add('active');

            if (target === 'calendar' && calendar) {
                setTimeout(() => calendar.render(), 100);
            }
            if (target === 'billing') loadBills();
            if (target === 'records') loadRecords();
            if (target === 'patients') loadPatientsTable();
        });
    });

    window.deleteCita = async (id) => {
        if (!confirm('¿Cancelar esta cita?')) return;
        const res = await fetch(`/api/appointments/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            await loadAppointments();
            await loadStats();
        }
    };

    window.marcarFacturaPagada = async (id) => {
        const res = await fetch(`/api/bills/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ estado: 'pagada' })
        });
        if (res.ok) {
            await loadBills();
            await loadStats();
        }
    };

    window.anularFactura = async (id) => {
        if (!confirm('¿Anular esta factura?')) return;
        const res = await fetch(`/api/bills/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ estado: 'anulada' })
        });
        if (res.ok) {
            await loadBills();
            await loadStats();
        }
    };

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    await loadIdentity();
    initChart();
    initCalendar();

    const patients = await loadPatients();
    fillPatientSelects(patients);
    await loadPhysios();

    await loadStats();
    await loadAppointments();
});
