
const API_URL = 'http://localhost:5000/api/appointments';

const detailsContainer =
    document.getElementById('appointmentDetails');

const params = new URLSearchParams(window.location.search);
const appointmentId = params.get('id');

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}


// LOAD APPOINTMENT DETAILS
async function loadAppointmentDetails() {

    if (!appointmentId) {
        detailsContainer.textContent =
            'No appointment ID was provided.';
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(appointmentId)}`
        );

        if (!response.ok) {
            throw new Error('Appointment not found.');
        }

        const a = await response.json();

        const formattedDate = new Date(a.appointmentDate)
            .toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

        detailsContainer.innerHTML = `

            <div class="details-header">

                <h3>${escapeHTML(a.appointmentId)}</h3>

                <span class="status status-${escapeHTML(a.status)}">
                    ${escapeHTML(a.status)}
                </span>

            </div>

            <div class="details-grid">

                <div class="detail-item">
                    <span>Patient Name</span>
                    <strong>${escapeHTML(a.patientName)}</strong>
                </div>

                <div class="detail-item">
                    <span>Doctor Name</span>
                    <strong>${escapeHTML(a.doctorName)}</strong>
                </div>

                <div class="detail-item">
                    <span>Appointment Date</span>
                    <strong>${formattedDate}</strong>
                </div>

                <div class="detail-item">
                    <span>Appointment Time</span>
                    <strong>${escapeHTML(a.appointmentTime)}</strong>
                </div>

                <div class="detail-item">
                    <span>Appointment Status</span>
                    <strong>${escapeHTML(a.status)}</strong>
                </div>

                <div class="detail-item">
                    <span>Appointment ID</span>
                    <strong>${escapeHTML(a.appointmentId)}</strong>
                </div>

                <div class="detail-item" style="grid-column: 1 / -1">
                    <span>Reason for Visit</span>
                    <strong>${escapeHTML(a.reason)}</strong>
                </div>

            </div>

            <div class="details-actions">

                <a class="button"
                   href="add-appointment.html?id=${encodeURIComponent(a.appointmentId)}">
                    Edit Appointment
                </a>

                <button class="button delete-btn" id="deleteButton">
                    Delete Appointment
                </button>

            </div>
        `;

        document.getElementById('deleteButton')
            .addEventListener('click', () => {
                deleteAppointment(a.appointmentId);
            });

    } catch (error) {

        console.error(error);

        detailsContainer.textContent = error.message;

    }
}


// DELETE APPOINTMENT
async function deleteAppointment(id) {

    const confirmed = confirm(
        `Are you sure you want to delete ${id}?`
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        alert('Appointment deleted successfully!');

        window.location.href = 'appointments.html';

    } catch (error) {

        alert(error.message);

    }
}


loadAppointmentDetails();