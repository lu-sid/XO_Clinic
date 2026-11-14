
const API_URL = "http://localhost:5000/api/appointments";

let allAppointments = [];
let filteredAppointments = [];

let currentPage = 1;
const PAGE_SIZE = 8;

let activeStatus = "All";

// DATE HELPERS

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

    if (match) {
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

    return value;
}

// SECURITY

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// INITIALS AND AVATAR COLORS

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

// STATUS

function getStatus(status) {
    const value = String(status || "Scheduled").toLowerCase();

    if (value === "completed") return "Completed";

    if (value === "cancelled" || value === "canceled") {
        return "Cancelled";
    }

    return "Scheduled";
}

// DOCTOR NAME

function getDoctorName(name) {
    const doctor = String(name || "Unassigned").trim();

    if (doctor === "Unassigned") return doctor;

    return doctor.replace(/^Dr\.?\s*/i, "");
}

function getDoctorDisplayName(name) {
    const doctor = getDoctorName(name);

    return doctor === "Unassigned" ? doctor : `Dr. ${doctor}`;
}

// UPDATE HEADER DATE

function updateHeaderDate() {
    const element = document.getElementById("currentDate");

    if (element) {
        element.textContent = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).toUpperCase();
    }
}

// LOAD APPOINTMENTS FROM MONGODB THROUGH EXPRESS

async function loadHistory() {
    const tableBody = document.getElementById("historyTableBody");

    try {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="history-loading">
                    Loading appointment records...
                </td>
            </tr>
        `;

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

        updateStatistics();
        populateDoctorFilter();
        applyFilters();

    } catch (error) {
        console.error("History loading error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="history-empty">
                    <div class="empty-icon">⚠</div>
                    <strong>Unable to load appointment history</strong>
                    <p>Please check your backend server and MongoDB connection.</p>
                </td>
            </tr>
        `;

        document.getElementById("recordCount").textContent = "ERROR";
        document.getElementById("paginationInfo").textContent =
            "Unable to retrieve records.";
    }
}

// STATISTICS

function updateStatistics() {
    const total = allAppointments.length;

    const completed = allAppointments.filter(a =>
        getStatus(a.status) === "Completed"
    ).length;

    const cancelled = allAppointments.filter(a =>
        getStatus(a.status) === "Cancelled"
    ).length;

    const scheduled = allAppointments.filter(a =>
        getStatus(a.status) === "Scheduled"
    ).length;

    document.getElementById("totalHistory").textContent = total;
    document.getElementById("completedHistory").textContent = completed;
    document.getElementById("cancelledHistory").textContent = cancelled;
    document.getElementById("scheduledHistory").textContent = scheduled;

    document.getElementById("recordCount").textContent =
        `${total} RECORDS`;
}

// POPULATE DOCTOR DROPDOWN

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

// APPLY SEARCH AND FILTERS

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

        // STATUS
        const matchesStatus =
            activeStatus === "All" ||
            status === activeStatus;

        // DOCTOR
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
            matchesStatus &&
            matchesDoctor &&
            matchesFrom &&
            matchesTo
        );
    });

    // NEWEST APPOINTMENTS FIRST

    filteredAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime() || 0;
        const dateB = new Date(b.appointmentDate).getTime() || 0;

        if (dateA !== dateB) {
            return dateB - dateA;
        }

        return String(b.appointmentTime || "")
            .localeCompare(String(a.appointmentTime || ""));
    });

    currentPage = 1;

    renderTable();
}

// RENDER TABLE

function renderTable() {
    const container = document.getElementById("historyTableBody");

    const total = filteredAppointments.length;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const endIndex = Math.min(
        startIndex + PAGE_SIZE,
        total
    );

    const pageRecords = filteredAppointments.slice(
        startIndex,
        endIndex
    );

    if (!pageRecords.length) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="history-empty">
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

            return `
                <tr>

                    <td>
                        <span class="history-id">
                            ${escapeHTML(appointment.appointmentId || "—")}
                        </span>
                    </td>

                    <td>
                        <div class="history-patient">

                            <div class="history-avatar"
                                style="background:${avatar.bg};color:${avatar.text}">
                                ${escapeHTML(getInitials(patient))}
                            </div>

                            <strong>${escapeHTML(patient)}</strong>

                        </div>
                    </td>

                    <td>
                        ${escapeHTML(getDoctorDisplayName(appointment.doctorName))}
                    </td>

                    <td>
                        ${formatDate(appointment.appointmentDate)}
                    </td>

                    <td>
                        ${formatTime(appointment.appointmentTime)}
                    </td>

                    <td>
                        <span class="history-status ${statusClass}">
                            ${status}
                        </span>
                    </td>

                    <td>
                        <a
                            class="history-details-link"
                            href="details.html?id=${encodeURIComponent(appointment.appointmentId || "")}"
                        >
                            View details →
                        </a>
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

// QUICK STATUS FILTERS

function setupQuickFilters() {
    const buttons = document.querySelectorAll(".quick-filter");

    buttons.forEach(button => {
        button.addEventListener("click", () => {

            buttons.forEach(btn => btn.classList.remove("active"));

            button.classList.add("active");

            activeStatus = button.dataset.status || "All";

            applyFilters();
        });
    });
}

// FILTER EVENT LISTENERS

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

    document.getElementById("resetFilters")
        .addEventListener("click", resetFilters);
}

// RESET FILTERS

function resetFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("doctorFilter").value = "";
    document.getElementById("dateFrom").value = "";
    document.getElementById("dateTo").value = "";

    activeStatus = "All";

    document.querySelectorAll(".quick-filter").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.status === "All"
        );
    });

    applyFilters();
}

// PAGINATION

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

// INITIALIZE

document.addEventListener("DOMContentLoaded", () => {

    updateHeaderDate();

    setupQuickFilters();

    setupFilters();

    setupPagination();

    loadHistory();

});
