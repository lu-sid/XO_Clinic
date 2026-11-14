
const API_URL = "http://localhost:5000/api/appointments";

let allAppointments = [];
let filteredAppointments = [];

let currentPage = 1;
const PAGE_SIZE = 8;

let activeView = "All";

// ------------------------------
// DATE HELPERS
// ------------------------------

function getDateKey(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(value) {
    if (!value) return "—";

    const match = String(value).match(/^(\d{1,2}):(\d{2})/);

    if (!match) return value;

    const date = new Date();

    date.setHours(
        Number(match[1]),
        Number(match[2]),
        0,
        0
    );

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ------------------------------
// PATIENT AVATAR
// ------------------------------

function getInitials(name) {
    return String(name || "Patient")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");
}

function getAvatarColor(name) {
    const colors = [
        { bg: "#ecfdf5", text: "#059669" },
        { bg: "#f0fdfa", text: "#0d9488" },
        { bg: "#f0f9ff", text: "#0284c7" },
        { bg: "#eef2ff", text: "#4f46e5" },
        { bg: "#faf5ff", text: "#9333ea" }
    ];

    let hash = 0;

    for (const char of String(name || "")) {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

// ------------------------------
// STATUS HELPERS
// ------------------------------

function getStatus(status) {
    const value = String(status || "Scheduled").toLowerCase();

    if (value === "completed") return "Completed";

    if (value === "cancelled" || value === "canceled") {
        return "Cancelled";
    }

    return "Scheduled";
}

function isUpcoming(appointment) {
    if (getStatus(appointment.status) !== "Scheduled") {
        return false;
    }

    const date = getDateKey(appointment.appointmentDate);

    if (!date) return false;

    const today = getDateKey(new Date());

    return date >= today;
}

function isPast(appointment) {
    if (getStatus(appointment.status) === "Cancelled") {
        return false;
    }

    const date = getDateKey(appointment.appointmentDate);

    if (!date) return false;

    const today = getDateKey(new Date());

    return date < today;
}

function getDoctorDisplayName(name) {
    const doctor = String(name || "Unassigned").trim();

    if (doctor === "Unassigned") return doctor;

    return /^dr\.?\s*/i.test(doctor)
        ? doctor.replace(/^dr\.?\s*/i, "Dr. ")
        : `Dr. ${doctor}`;
}

// ------------------------------
// LOAD APPOINTMENTS
// ------------------------------

async function loadAppointments() {
    const tableBody = document.getElementById("appointmentTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-state">
                Loading appointment records...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`${API_URL}?sort=desc`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        allAppointments = Array.isArray(data)
            ? data
            : (data.appointments || data.data || []);

        if (!Array.isArray(allAppointments)) {
            throw new Error("Invalid appointment data received.");
        }

        populateDoctorFilter();
        applyFilters();

    } catch (error) {
        console.error("Appointment loading error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-icon">⚠</div>
                    <strong>Unable to load appointments</strong>
                    <p>Please check your backend server and MongoDB connection.</p>
                </td>
            </tr>
        `;

        document.getElementById("recordCount").textContent = "ERROR";
        document.getElementById("paginationInfo").textContent =
            "Unable to retrieve records.";
    }
}

// ------------------------------
// DOCTOR FILTER
// ------------------------------

function populateDoctorFilter() {
    const select = document.getElementById("doctorFilter");
    const selectedDoctor = select.value;

    const doctors = [
        ...new Set(
            allAppointments
                .map(a => String(a.doctorName || "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    select.innerHTML = `
        <option value="">All doctors</option>
        ${doctors.map(doctor => `
            <option value="${escapeHTML(doctor)}">
                ${escapeHTML(getDoctorDisplayName(doctor))}
            </option>
        `).join("")}
    `;

    if (doctors.includes(selectedDoctor)) {
        select.value = selectedDoctor;
    }
}

// ------------------------------
// APPLY SEARCH AND FILTERS
// ------------------------------

function applyFilters() {
    const search = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    const doctor = document.getElementById("doctorFilter").value;
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;

    filteredAppointments = allAppointments.filter(appointment => {

        const appointmentId = String(
            appointment.appointmentId || ""
        ).toLowerCase();

        const patientName = String(
            appointment.patientName || ""
        ).toLowerCase();

        const doctorName = String(
            appointment.doctorName || ""
        ).toLowerCase();

        const status = getStatus(appointment.status);
        const appointmentDate = getDateKey(appointment.appointmentDate);

        // SEARCH

        const matchesSearch =
            !search ||
            appointmentId.includes(search) ||
            patientName.includes(search) ||
            doctorName.includes(search);

        // TAB FILTER

        let matchesView = true;

        if (activeView === "Upcoming") {
            matchesView = isUpcoming(appointment);
        } else if (activeView === "Past") {
            matchesView = isPast(appointment);
        } else if (activeView === "Completed") {
            matchesView = status === "Completed";
        } else if (activeView === "Cancelled") {
            matchesView = status === "Cancelled";
        }

        // DOCTOR FILTER

        const matchesDoctor =
            !doctor ||
            appointment.doctorName === doctor;

        // DATE RANGE

        const matchesFrom =
            !dateFrom ||
            (appointmentDate && appointmentDate >= dateFrom);

        const matchesTo =
            !dateTo ||
            (appointmentDate && appointmentDate <= dateTo);

        return (
            matchesSearch &&
            matchesView &&
            matchesDoctor &&
            matchesFrom &&
            matchesTo
        );
    });

    sortAppointments();

    currentPage = 1;
    renderTable();
}

// ------------------------------
// SORTING
// ------------------------------

function sortAppointments() {
    const sortValue = document.getElementById("sortSelect").value;

    filteredAppointments.sort((a, b) => {

        const dateA = getDateKey(a.appointmentDate);
        const dateB = getDateKey(b.appointmentDate);

        const nameA = String(a.patientName || "").toLowerCase();
        const nameB = String(b.patientName || "").toLowerCase();

        if (sortValue === "date-asc") {
            return dateA.localeCompare(dateB);
        }

        if (sortValue === "date-desc") {
            return dateB.localeCompare(dateA);
        }

        if (sortValue === "name-asc") {
            return nameA.localeCompare(nameB);
        }

        if (sortValue === "name-desc") {
            return nameB.localeCompare(nameA);
        }

        if (sortValue === "updated-desc") {
            return new Date(b.updatedAt || b.createdAt || 0) -
                   new Date(a.updatedAt || a.createdAt || 0);
        }

        return 0;
    });
}

// ------------------------------
// RENDER TABLE
// ------------------------------

function renderTable() {
    const container = document.getElementById("appointmentTableBody");

    const total = filteredAppointments.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, total);

    const pageRecords = filteredAppointments.slice(
        startIndex,
        endIndex
    );

    if (!pageRecords.length) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-icon">⌕</div>
                    <strong>No appointments found</strong>
                    <p>Try changing your search or filter criteria.</p>
                </td>
            </tr>
        `;
    } else {

        container.innerHTML = pageRecords.map(appointment => {

            const patient = appointment.patientName || "Unknown";
            const avatar = getAvatarColor(patient);
            const status = getStatus(appointment.status);
            const statusClass = status.toLowerCase();

            const appointmentId = appointment.appointmentId || "";

            return `
                <tr>

                    <td>
                        <span class="appointment-id">
                            ${escapeHTML(appointmentId || "—")}
                        </span>
                    </td>

                    <td>
                        <div class="patient-cell">

                            <div class="patient-avatar"
                                style="background:${avatar.bg};color:${avatar.text}">
                                ${escapeHTML(getInitials(patient))}
                            </div>

                            <strong>${escapeHTML(patient)}</strong>

                        </div>
                    </td>

                    <td>
                        ${escapeHTML(getDoctorDisplayName(appointment.doctorName))}
                    </td>

                    <td>${formatDate(appointment.appointmentDate)}</td>

                    <td>${formatTime(appointment.appointmentTime)}</td>

                    <td>
                        <span class="status-badge ${statusClass}">
                            ${status}
                        </span>
                    </td>

                    <td>
                        <div class="table-actions">

                            <a
                                class="view-link"
                                href="details.html?id=${encodeURIComponent(appointmentId)}"
                            >
                                View details
                            </a>

                            <button
                                type="button"
                                class="delete-link"
                                data-delete-id="${escapeHTML(appointmentId)}"
                            >
                                Delete
                            </button>

                        </div>
                    </td>

                </tr>
            `;
        }).join("");
    }

    // PAGINATION INFORMATION

    document.getElementById("paginationInfo").textContent =
        total === 0
            ? "Showing 0 records"
            : `Showing ${startIndex + 1}–${endIndex} of ${total} appointments`;

    document.getElementById("currentPage").textContent =
        `${currentPage} / ${totalPages}`;

    document.getElementById("previousPage").disabled =
        currentPage === 1;

    document.getElementById("nextPage").disabled =
        currentPage === totalPages || total === 0;

    document.getElementById("recordCount").textContent =
        `${total} RECORDS`;
}

// ------------------------------
// DELETE APPOINTMENT
// ------------------------------

async function deleteAppointment(appointmentId) {

    if (!appointmentId) {
        alert("Appointment ID is missing.");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete appointment ${appointmentId}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(appointmentId)}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to delete appointment."
            );
        }

        alert("Appointment deleted successfully.");

        await loadAppointments();

    } catch (error) {
        console.error("Delete error:", error);
        alert(error.message || "Something went wrong while deleting.");
    }
}

// ------------------------------
// QUICK VIEW TABS
// ------------------------------

function setupTabs() {
    const buttons = document.querySelectorAll(".appointment-tab");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            buttons.forEach(btn => btn.classList.remove("active"));

            button.classList.add("active");

            activeView = button.dataset.view || "All";

            applyFilters();
        });
    });
}

// ------------------------------
// FILTER EVENT LISTENERS
// ------------------------------

function setupFilters() {

    document.getElementById("searchInput")
        .addEventListener("input", applyFilters);

    document.getElementById("doctorFilter")
        .addEventListener("change", applyFilters);

    document.getElementById("dateFrom")
        .addEventListener("change", () => {

            const from = document.getElementById("dateFrom").value;
            const to = document.getElementById("dateTo").value;

            if (from && to && from > to) {
                document.getElementById("dateTo").value = from;
            }

            applyFilters();
        });

    document.getElementById("dateTo")
        .addEventListener("change", () => {

            const from = document.getElementById("dateFrom").value;
            const to = document.getElementById("dateTo").value;

            if (from && to && to < from) {
                document.getElementById("dateFrom").value = to;
            }

            applyFilters();
        });

    document.getElementById("sortSelect")
        .addEventListener("change", () => {
            sortAppointments();
            currentPage = 1;
            renderTable();
        });

    document.getElementById("resetFilters")
        .addEventListener("click", resetFilters);
}

// ------------------------------
// RESET FILTERS
// ------------------------------

function resetFilters() {

    document.getElementById("searchInput").value = "";
    document.getElementById("doctorFilter").value = "";
    document.getElementById("dateFrom").value = "";
    document.getElementById("dateTo").value = "";
    document.getElementById("sortSelect").value = "date-desc";

    activeView = "All";

    document.querySelectorAll(".appointment-tab").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.view === "All"
        );
    });

    applyFilters();
}

// ------------------------------
// PAGINATION
// ------------------------------

function setupPagination() {

    document.getElementById("previousPage")
        .addEventListener("click", () => {

            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

    document.getElementById("nextPage")
        .addEventListener("click", () => {

            const totalPages = Math.ceil(
                filteredAppointments.length / PAGE_SIZE
            );

            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
}

// ------------------------------
// CSV EXPORT
// ------------------------------

function exportCSV() {

    if (!filteredAppointments.length) {
        alert("There are no appointment records to export.");
        return;
    }

    const headers = [
        "Appointment ID",
        "Patient Name",
        "Doctor Name",
        "Appointment Date",
        "Appointment Time",
        "Status",
        "Reason"
    ];

    const rows = filteredAppointments.map(a => [
        a.appointmentId,
        a.patientName,
        a.doctorName,
        getDateKey(a.appointmentDate),
        a.appointmentTime,
        getStatus(a.status),
        a.reason
    ]);

    function csvValue(value) {
        let text = String(value ?? "");

        // Prevent spreadsheet formula injection.
        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;
    }

    const csv = [headers, ...rows]
        .map(row => row.map(csvValue).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "XO_Clinic_Appointments.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ------------------------------
// PRINT RECORDS
// ------------------------------

function printRecords() {

    if (!filteredAppointments.length) {
        alert("There are no appointment records to print.");
        return;
    }

    const rows = filteredAppointments.map(a => `
        <tr>
            <td>${escapeHTML(a.appointmentId || "—")}</td>
            <td>${escapeHTML(a.patientName || "—")}</td>
            <td>${escapeHTML(getDoctorDisplayName(a.doctorName))}</td>
            <td>${escapeHTML(formatDate(a.appointmentDate))}</td>
            <td>${escapeHTML(formatTime(a.appointmentTime))}</td>
            <td>${escapeHTML(getStatus(a.status))}</td>
            <td>${escapeHTML(a.reason || "—")}</td>
        </tr>
    `).join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow pop-ups to print appointment records.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>XO Clinic - Appointment Records</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 25px;
                    color: #222;
                }

                h1 {
                    margin-bottom: 5px;
                    color: #0d9488;
                }

                p {
                    color: #666;
                    font-size: 13px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 25px;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 9px;
                    text-align: left;
                    font-size: 11px;
                }

                th {
                    background: #f1f5f9;
                }

                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h1>XO Clinic</h1>
            <p>Appointment Records | Generated ${new Date().toLocaleString("en-IN")}</p>

            <table>
                <thead>
                    <tr>
                        <th>Appointment ID</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

// ------------------------------
// TABLE ACTIONS
// ------------------------------

function setupTableActions() {

    document.getElementById("appointmentTableBody")
        .addEventListener("click", event => {

            const deleteButton = event.target.closest("[data-delete-id]");

            if (deleteButton) {
                deleteAppointment(deleteButton.dataset.deleteId);
            }
        });
}

// ------------------------------
// INITIALIZE
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {

    setupTabs();
    setupFilters();
    setupPagination();
    setupTableActions();

    document.getElementById("exportCSV")
        .addEventListener("click", exportCSV);

    document.getElementById("printRecords")
        .addEventListener("click", printRecords);

    loadAppointments();
});
