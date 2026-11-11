
const API_URL = 'http://localhost:5000/api/appointments';

const searchInput = document.getElementById('searchInput');
const doctorFilter = document.getElementById('doctorFilter');
const dateFilter = document.getElementById('dateFilter');
const statusFilter = document.getElementById('statusFilter');
const sortFilter = document.getElementById('sortFilter');

const tableContainer = document.getElementById('appointmentsTable');
const resultCount = document.getElementById('resultCount');

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

// Fetch appointments using selected filters
async function loadAppointments() {

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
            throw new Error('Unable to fetch appointments');
        }

        const data = await response.json();

        displayAppointments(data.appointments);

    } catch (error) {
        tableContainer.textContent = 'Error loading appointments. Please try again.';
    }
}

// Display appointments in table
function displayAppointments(appointments) {

    resultCount.textContent = `${appointments.length} records`;

    if (appointments.length === 0) {
        tableContainer.innerHTML =
            '<p class="muted">No matching appointments found.</p>';
        return;
    }

    const rows = appointments.map(a => {

        const date = new Date(a.appointmentDate)
            .toLocaleDateString('en-IN');

        return `
            <tr>
                <td>${escapeHTML(a.appointmentId)}</td>
                <td>${escapeHTML(a.patientName)}</td>
                <td>${escapeHTML(a.doctorName)}</td>
                <td>${date}</td>
                <td>${escapeHTML(a.appointmentTime)}</td>
                <td>
                    <span class="status status-${escapeHTML(a.status)}">
                        ${escapeHTML(a.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">

                        <a class="view-btn"
                           href="details.html?id=${encodeURIComponent(a.appointmentId)}">
                           View
                        </a>

                        <a class="edit-btn"
                           href="add-appointment.html?id=${encodeURIComponent(a.appointmentId)}">
                           Edit
                        </a>

                        <button class="delete-btn"
                           onclick="deleteAppointment('${encodeURIComponent(a.appointmentId)}')">
                           Delete
                        </button>

                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// Delete appointment
async function deleteAppointment(id) {

    const appointmentId = decodeURIComponent(id);

    const confirmDelete = confirm(
        `Are you sure you want to delete ${appointmentId}?`
    );

    if (!confirmDelete) return;

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(appointmentId)}`,
            { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        alert(data.message);
        loadAppointments();

    } catch (error) {
        alert(error.message || 'Unable to delete appointment.');
    }
}

// Filter event listeners
searchInput.addEventListener('input', loadAppointments);
doctorFilter.addEventListener('change', loadAppointments);
dateFilter.addEventListener('change', loadAppointments);
statusFilter.addEventListener('change', loadAppointments);
sortFilter.addEventListener('change', loadAppointments);

// Clear all filters
document.getElementById('clearFilters').addEventListener('click', () => {

    searchInput.value = '';
    doctorFilter.value = '';
    dateFilter.value = '';
    statusFilter.value = '';
    sortFilter.value = 'asc';

    loadAppointments();
});

// Initial loading
loadAppointments();
