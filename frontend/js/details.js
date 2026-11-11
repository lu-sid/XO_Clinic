
const API_URL = "http://localhost:5000/api/appointments";

const detailsContainer = document.getElementById("appointmentDetails");

const params = new URLSearchParams(window.location.search);
const appointmentId = params.get("id");

// Format date for display
function formatDate(dateString) {
    if (!dateString) return "Not available";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// Prevent HTML injection
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// Load appointment details
async function loadAppointmentDetails() {

    if (!appointmentId) {
        detailsContainer.innerHTML = `
            <div class="error-message">
                <h3>Appointment ID Missing</h3>
                <p>No appointment ID was provided.</p>
                <a href="appointments.html">Return to Appointments</a>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(appointmentId)}`
        );

        if (!response.ok) {
            throw new Error("Appointment not found.");
        }

        const result = await response.json();

        // Supports either a direct appointment or wrapped API response
        const appointment =
            result.appointment ||
            result.data ||
            result;

        if (!appointment || !appointment.appointmentId) {
            throw new Error("Invalid appointment data.");
        }

        displayAppointment(appointment);

    } catch (error) {
        console.error("Error loading appointment:", error);

        detailsContainer.innerHTML = `
            <div class="error-message">
                <h3>Unable to Load Appointment</h3>
                <p>${escapeHTML(error.message)}</p>
                <a href="appointments.html">Return to Appointments</a>
            </div>
        `;
    }
}

// Display appointment information
function displayAppointment(appointment) {

    const status = appointment.status || "Scheduled";

    detailsContainer.innerHTML = `

        <div class="details-header">

            <div>
                <h2>Appointment Overview</h2>
                <p>Appointment ID: ${escapeHTML(appointment.appointmentId)}</p>
            </div>

            <span class="status-badge status-${escapeHTML(status)}">
                ${escapeHTML(status)}
            </span>

        </div>

        <div class="details-section">

            <h3>Patient and Doctor Information</h3>

            <div class="details-grid">

                <div class="detail-item">
                    <div class="detail-label">Patient Name</div>
                    <div class="detail-value">
                        ${escapeHTML(appointment.patientName)}
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Doctor Name</div>
                    <div class="detail-value">
                        ${escapeHTML(appointment.doctorName)}
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Appointment Date</div>
                    <div class="detail-value">
                        ${escapeHTML(formatDate(appointment.appointmentDate))}
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Appointment Time</div>
                    <div class="detail-value">
                        ${escapeHTML(appointment.appointmentTime)}
                    </div>
                </div>

            </div>

        </div>

        <div class="details-section">

            <h3>Reason for Appointment</h3>

            <div class="reason-box">
                ${escapeHTML(appointment.reason || "No reason provided.")}
            </div>

        </div>

        <div class="details-actions">

            <a
                href="add-appointment.html?id=${encodeURIComponent(appointment.appointmentId)}"
                class="edit-btn"
            >
                Edit Appointment
            </a>

            <button
                type="button"
                class="delete-btn"
                id="deleteAppointment"
            >
                Delete Appointment
            </button>

        </div>
    `;

    // Attach delete functionality
    document
        .getElementById("deleteAppointment")
        .addEventListener("click", () => {
            deleteAppointment(appointment.appointmentId);
        });
}

// Delete appointment
async function deleteAppointment(id) {

    const confirmed = confirm(
        `Are you sure you want to delete appointment ${id}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete appointment.");
        }

        alert("Appointment deleted successfully!");

        window.location.href = "appointments.html";

    } catch (error) {
        console.error("Delete error:", error);
        alert(error.message || "Something went wrong while deleting.");
    }
}

// Initialize page
loadAppointmentDetails();
