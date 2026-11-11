
const API_URL = 'http://localhost:5000/api/appointments';

// DOM elements
const searchInput = document.getElementById('searchInput');
const doctorFilter = document.getElementById('doctorFilter');
const dateFilter = document.getElementById('dateFilter');
const statusFilter = document.getElementById('statusFilter');
const sortFilter = document.getElementById('sortFilter');

const tableContainer = document.getElementById('appointmentsTable');
const resultCount = document.getElementById('resultCount');

// Prevent HTML injection when displaying text
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}


// LOAD APPOINTMENTS
async function loadAppointments() {

    tableContainer.textContent = 'Loading appointments...';

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

        const response = await fetch(
            `${API_URL}?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        displayAppointments(data.appointments || []);

    } catch (error) {

        console.error('Appointment loading error:', error);

        resultCount.textContent = 'Error';

        tableContainer.textContent =
            'Unable to load appointments. Check the server connection.';

    }
}


// DISPLAY APPOINTMENTS
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

                        <button
                            class="delete-btn"
                            data-id="${escapeHTML(a.appointmentId)}"
                            type="button">
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

            <tbody>
                ${rows}
            </tbody>

        </table>
    `;

}


// DELETE APPOINTMENT
async function deleteAppointment(appointmentId) {

    const confirmDelete = confirm(
        `Are you sure you want to delete appointment ${appointmentId}?`
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(appointmentId)}`,
            {
                method: 'DELETE'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Delete failed');
        }

        alert('Appointment deleted successfully!');

        loadAppointments();

    } catch (error) {

        console.error('Delete error:', error);

        alert(error.message || 'Unable to delete appointment.');

    }
}


// HANDLE DELETE BUTTONS
tableContainer.addEventListener('click', function(event) {

    const button = event.target.closest('.delete-btn');

    if (!button) return;

    deleteAppointment(button.dataset.id);

});


// SEARCH AND FILTER EVENTS
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
