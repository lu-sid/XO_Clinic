const API_URL = 'http://localhost:5000/api/appointments';

// DOM elements
const searchInput = document.getElementById('searchInput');
const doctorFilter = document.getElementById('doctorFilter');
const dateFilter = document.getElementById('dateFilter');
const statusFilter = document.getElementById('statusFilter');
const sortFilter = document.getElementById('sortFilter');

const tableContainer = document.getElementById('appointmentsTable');
const resultCount = document.getElementById('resultCount');

// Prevent HTML injection
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

// Generate patient initials
function getInitials(name) {
    return String(name || "Patient")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");
}

// Pastel avatar tags for patient icons
function getAvatarColor(name) {
    const palettes = [
        { bg: "#ecfdf5", text: "#059669" },
        { bg: "#f0fdfa", text: "#0d9488" },
        { bg: "#f0f9ff", text: "#0284c7" },
        { bg: "#eef2ff", text: "#4f46e5" },
        { bg: "#faf5ff", text: "#9333ea" }
    ];
    let hash = 0;
    const str = String(name || "");
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palettes[Math.abs(hash) % palettes.length];
}

// LOAD APPOINTMENTS
async function loadAppointments() {
    tableContainer.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">Loading appointments...</td>
        </tr>
    `;

    try {
        const params = new URLSearchParams();

        if (searchInput.value.trim()) {
            params.set('search', searchInput.value.trim());
        }

        if (doctorFilter.value) {
            params.set('doctorName', doctorFilter.value);
        }

        if (dateFilter.value) {
            params.set('date', dateFilter.value);
        }

        if (statusFilter.value) {
            params.set('status', statusFilter.value);
        }

        params.set('sort', sortFilter.value);

        const response = await fetch(`${API_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        const appointments = Array.isArray(data)
            ? data
            : (data.appointments || data.data || []);

        displayAppointments(appointments);

    } catch (error) {
        console.error('Appointment loading error:', error);
        resultCount.textContent = 'Connection error';
        tableContainer.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell" style="color: #e11d48 !important;">
                    Unable to load appointments. Please ensure your backend server is running.
                </td>
            </tr>
        `;
    }
}

// DISPLAY APPOINTMENTS
function displayAppointments(appointments) {
    resultCount.textContent = `${appointments.length} record${appointments.length === 1 ? '' : 's'} found`;

    if (appointments.length === 0) {
        tableContainer.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    <p style="margin: 0; font-size: 13.5px; color: var(--muted);">No matching appointments found.</p>
                </td>
            </tr>
        `;
        return;
    }

    const rows = appointments.map(a => {
        const rawDate = a.appointmentDate || a.createdAt;
        let date = '—';

        if (rawDate) {
            const dateObj = /^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))
                ? new Date(`${rawDate}T00:00:00`)
                : new Date(rawDate);

            if (!Number.isNaN(dateObj.getTime())) {
                date = dateObj.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        }

        const status = String(a.status || 'Scheduled');
        const statusClass = status.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const avatar = getAvatarColor(a.patientName);
        const initials = escapeHTML(getInitials(a.patientName));
        const formattedDoctor = escapeHTML(String(a.doctorName || 'Unassigned').replace(/^Dr\.?\s*/i, ''));

        return `
            <tr>
                <td>
                    <span class="appointment-code">
                        #${escapeHTML(a.appointmentId)}
                    </span>
                </td>

                <td>
                    <div class="patient-cell">
                        <div class="patient-avatar" style="background:${avatar.bg}; color:${avatar.text}">
                            ${initials}
                        </div>
                        <span class="patient-name">${escapeHTML(a.patientName)}</span>
                    </div>
                </td>

                <td>
                    <span class="doctor-name">Dr. ${formattedDoctor}</span>
                </td>

                <td>
                    <span style="font-weight: 500; color: #475569;">${date}</span>
                </td>

                <td>
                    <span class="time-badge">${escapeHTML(a.appointmentTime || '—')}</span>
                </td>

                <td>
                    <span class="dashboard-status ${statusClass}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        <a class="action-btn view-btn"
                           href="details.html?id=${encodeURIComponent(a.appointmentId)}"
                           title="View Details">
                            View
                        </a>

                        <a class="action-btn edit-btn"
                           href="add-appointment.html?id=${encodeURIComponent(a.appointmentId)}"
                           title="Edit Appointment">
                            Edit
                        </a>

                        <button
                            class="action-btn delete-btn"
                            data-id="${escapeHTML(a.appointmentId)}"
                            type="button"
                            title="Delete Appointment">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableContainer.innerHTML = rows;
}

// DELETE APPOINTMENT
async function deleteAppointment(appointmentId) {
    const confirmDelete = confirm(
        `Are you sure you want to delete appointment #${appointmentId}?`
    );

    if (!confirmDelete) return;

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(appointmentId)}`,
            { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Delete failed');
        }

        loadAppointments();

    } catch (error) {
        console.error('Delete error:', error);
        alert(error.message || 'Unable to delete appointment.');
    }
}

// HANDLE DELETE BUTTON CLICKS
tableContainer.addEventListener('click', function(event) {
    const button = event.target.closest('.delete-btn');
    if (!button) return;
    deleteAppointment(button.dataset.id);
});

// SEARCH AND FILTER EVENT LISTENERS
searchInput.addEventListener('input', loadAppointments);
doctorFilter.addEventListener('change', loadAppointments);
dateFilter.addEventListener('change', loadAppointments);
statusFilter.addEventListener('change', loadAppointments);
sortFilter.addEventListener('change', loadAppointments);

// CLEAR FILTERS
document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value = '';
    doctorFilter.value = '';
    dateFilter.value = '';
    statusFilter.value = '';
    sortFilter.value = 'asc';
    loadAppointments();
});

// INITIAL LOAD
loadAppointments();