
const API_URL = "http://localhost:5000/api/appointments";

let activityChart = null;
let statusChart = null;
let doctorChart = null;

let allAppointments = [];

// CLINIC COLORS
const CLINIC_COLORS = {
    teal: "#0d9488",
    tealLight: "#14b8a6",
    blue: "#0284c7",
    green: "#10b981",
    red: "#f43f5e",
    grid: "rgba(226, 232, 240, 0.7)",
    text: "#64748b",
    dark: "#090e17"
};

// DATE HELPERS
function updateDate() {
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

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getLocalDateKey(value) {
    if (!value) return "";

    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
        ? new Date(value + "T00:00:00")
        : new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTodayKey() {
    return getLocalDateKey(new Date());
}

function getAppointmentDate(appointment) {
    return appointment.appointmentDate ||
           appointment.createdAt ||
           "";
}

function getAppointmentTime(appointment) {
    return appointment.appointmentTime ||
           appointment.time ||
           appointment.appointment_time ||
           "";
}

function formatDate(value) {
    if (!value) return "—";

    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
        ? new Date(value + "T00:00:00")
        : new Date(value);

    if (Number.isNaN(date.getTime())) return escapeHTML(value);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(value) {
    if (!value) return "Time not set";

    // Handle HH:mm and HH:mm:ss formats.
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);

    if (match) {
        const date = new Date();
        date.setHours(Number(match[1]), Number(match[2]), 0, 0);

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    return escapeHTML(value);
}

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

function normalizeStatus(status) {
    const value = String(status || "Scheduled").trim().toLowerCase();

    if (value === "completed") return "Completed";
    if (value === "cancelled" || value === "canceled") return "Cancelled";

    return "Scheduled";
}

function normalizeDoctor(name) {
    const doctor = String(name || "Unassigned").trim();

    if (doctor === "Unassigned") return doctor;

    return doctor.replace(/^Dr\.?\s*/i, "");
}

function getDoctorDisplayName(name) {
    const doctor = normalizeDoctor(name);

    return doctor === "Unassigned" ? doctor : `Dr. ${doctor}`;
}

function getPatientKey(appointment) {
    return String(appointment.patientName || "")
        .trim()
        .toLowerCase();
}

function getPatientRecordDate(appointment) {
    // createdAt is preferred for new-patient calculations.
    // appointmentDate is used as a fallback.
    return getAppointmentDate(appointment);
}

// LOAD DASHBOARD
async function loadDashboard() {
    const recentContainer = document.getElementById("recentAppointments");

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        const appointments = Array.isArray(data)
            ? data
            : (data.appointments || data.data || []);

        if (!Array.isArray(appointments)) {
            throw new Error("Invalid appointment list.");
        }

        allAppointments = appointments;

        updateStatistics(appointments);
        updatePatientStatistics(appointments);
        updateRecentAppointments(appointments);
        updateTodaySchedule(appointments);
        updateDoctorAvailability(appointments);

        createActivityChart(appointments);
        createStatusChart(appointments);
        createDoctorChart(appointments);

    } catch (error) {
        console.error("Dashboard loading error:", error);

        if (recentContainer) {
            recentContainer.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-cell">
                        Unable to load dashboard data.
                        Please check that your server is running.
                    </td>
                </tr>
            `;
        }

        [
            "totalCount",
            "scheduledCount",
            "completedCount",
            "cancelledCount",
            "legendScheduled",
            "legendCompleted",
            "legendCancelled",
            "totalPatients",
            "newPatients",
            "returningPatients",
            "historyTotal",
            "historyCompleted",
            "historyCancelled"
        ].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = "—";
        });

        const schedule = document.getElementById("todayScheduleList");
        const doctors = document.getElementById("doctorAvailabilityList");
        const history = document.getElementById("historyAppointments");

        if (schedule) {
            schedule.innerHTML = `
                <div class="schedule-empty">
                    Unable to load today's schedule.
                </div>
            `;
        }

        if (doctors) {
            doctors.innerHTML = `
                <div class="schedule-empty">
                    Unable to load doctor information.
                </div>
            `;
        }

        if (history) {
            history.innerHTML = `
                <tr>
                    <td colspan="6" class="history-empty">
                        Unable to load appointment history.
                    </td>
                </tr>
            `;
        }
    }
}

// 1. APPOINTMENT STATISTICS
function updateStatistics(appointments) {
    const counts = {
        Scheduled: appointments.filter(a =>
            normalizeStatus(a.status) === "Scheduled"
        ).length,

        Completed: appointments.filter(a =>
            normalizeStatus(a.status) === "Completed"
        ).length,

        Cancelled: appointments.filter(a =>
            normalizeStatus(a.status) === "Cancelled"
        ).length
    };

    const values = {
        totalCount: appointments.length,
        scheduledCount: counts.Scheduled,
        completedCount: counts.Completed,
        cancelledCount: counts.Cancelled,
        legendScheduled: counts.Scheduled,
        legendCompleted: counts.Completed,
        legendCancelled: counts.Cancelled
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// 2. PATIENT STATISTICS
function updatePatientStatistics(appointments) {
    const patients = new Map();

    appointments.forEach(appointment => {
        const key = getPatientKey(appointment);

        if (!key) return;

        const recordDate = getPatientRecordDate(appointment);
        const date = getLocalDateKey(recordDate);

        if (!patients.has(key)) {
            patients.set(key, {
                count: 0,
                firstDate: date
            });
        }

        const patient = patients.get(key);

        patient.count++;

        if (date && (!patient.firstDate || date < patient.firstDate)) {
            patient.firstDate = date;
        }
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let newPatients = 0;
    let returningPatients = 0;

    patients.forEach(patient => {
        if (patient.count > 1) {
            returningPatients++;
        }

        if (patient.firstDate) {
            const date = new Date(patient.firstDate + "T00:00:00");

            if (
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
            ) {
                newPatients++;
            }
        }
    });

    document.getElementById("totalPatients").textContent = patients.size;
    document.getElementById("newPatients").textContent = newPatients;
    document.getElementById("returningPatients").textContent = returningPatients;
}

// 3. RECENT APPOINTMENTS
function updateRecentAppointments(appointments) {
    const container = document.getElementById("recentAppointments");

    if (!container) return;

    if (!appointments.length) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    No appointments recorded yet.
                </td>
            </tr>
        `;
        return;
    }

    const recent = [...appointments]
        .sort((a, b) => {
            const dateA = new Date(a.createdAt || getAppointmentDate(a)).getTime() || 0;
            const dateB = new Date(b.createdAt || getAppointmentDate(b)).getTime() || 0;

            return dateB - dateA;
        })
        .slice(0, 6);

    container.innerHTML = recent.map(appointment => {
        const initials = escapeHTML(getInitials(appointment.patientName));
        const status = normalizeStatus(appointment.status);
        const statusClass = status.toLowerCase();
        const avatar = getAvatarColor(appointment.patientName);

        return `
            <tr>
                <td>
                    <span class="appointment-code">
                        ${escapeHTML(appointment.appointmentId || "—")}
                    </span>
                </td>

                <td>
                    <div class="patient-cell">
                        <div class="patient-avatar"
                            style="background:${avatar.bg};color:${avatar.text}">
                            ${initials}
                        </div>

                        <span class="patient-name">
                            ${escapeHTML(appointment.patientName || "Unknown")}
                        </span>
                    </div>
                </td>

                <td>
                    <span class="doctor-name">
                        ${escapeHTML(getDoctorDisplayName(appointment.doctorName))}
                    </span>
                </td>

                <td>${formatDate(getAppointmentDate(appointment))}</td>

                <td>
                    <span class="dashboard-status ${statusClass}">
                        ${status}
                    </span>
                </td>

                <td>
                    <a class="table-action"
                        href="details.html?id=${encodeURIComponent(appointment.appointmentId || "")}">
                        Details →
                    </a>
                </td>
            </tr>
        `;
    }).join("");
}

// 4. TODAY'S SCHEDULE
function updateTodaySchedule(appointments) {
    const container = document.getElementById("todayScheduleList");

    if (!container) return;

    const today = getTodayKey();

    const todaysAppointments = appointments
        .filter(appointment => {
            return getLocalDateKey(getAppointmentDate(appointment)) === today &&
                   normalizeStatus(appointment.status) !== "Cancelled";
        })
        .sort((a, b) => {
            const timeA = getAppointmentTime(a) || "99:99";
            const timeB = getAppointmentTime(b) || "99:99";

            return String(timeA).localeCompare(String(timeB));
        });

    if (!todaysAppointments.length) {
        container.innerHTML = `
            <div class="schedule-empty">
                <div style="font-size:26px;margin-bottom:10px;">☼</div>
                <strong>No appointments today</strong>
                <p style="margin-top:6px;">
                    Your clinic has no scheduled appointments for today.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = todaysAppointments.map(appointment => {
        const avatar = getAvatarColor(appointment.patientName);
        const initials = escapeHTML(getInitials(appointment.patientName));
        const status = normalizeStatus(appointment.status);

        return `
            <div class="schedule-item">

                <div class="schedule-time">
                    ${formatTime(getAppointmentTime(appointment))}
                </div>

                <div class="schedule-avatar"
                    style="background:${avatar.bg};color:${avatar.text}">
                    ${initials}
                </div>

                <div class="schedule-details">
                    <strong>${escapeHTML(appointment.patientName || "Unknown patient")}</strong>
                    <span>${escapeHTML(getDoctorDisplayName(appointment.doctorName))}</span>
                </div>

                <span class="availability-badge ${status === "Completed" ? "free" : "scheduled"}">
                    ${status}
                </span>

            </div>
        `;
    }).join("");
}

// 5. DOCTOR OVERVIEW / AVAILABILITY
function updateDoctorAvailability(appointments) {
    const container = document.getElementById("doctorAvailabilityList");

    if (!container) return;

    const doctors = new Map();
    const today = getTodayKey();

    appointments.forEach(appointment => {
        const name = normalizeDoctor(appointment.doctorName);

        if (name === "Unassigned") return;

        if (!doctors.has(name)) {
            doctors.set(name, {
                total: 0,
                today: 0,
                completed: 0
            });
        }

        const doctor = doctors.get(name);

        doctor.total++;

        if (
            getLocalDateKey(getAppointmentDate(appointment)) === today &&
            normalizeStatus(appointment.status) !== "Cancelled"
        ) {
            doctor.today++;

            if (normalizeStatus(appointment.status) === "Completed") {
                doctor.completed++;
            }
        }
    });

    const sortedDoctors = [...doctors.entries()]
        .sort((a, b) => b[1].today - a[1].today);

    if (!sortedDoctors.length) {
        container.innerHTML = `
            <div class="schedule-empty">
                No doctor records available.
            </div>
        `;
        return;
    }

    container.innerHTML = sortedDoctors.map(([name, data]) => {
        let label;
        let badgeClass;

        if (data.today === 0) {
            label = "No appointments";
            badgeClass = "free";
        } else if (data.today >= 4) {
            label = "Busy today";
            badgeClass = "booked";
        } else {
            label = "Scheduled";
            badgeClass = "scheduled";
        }

        return `
            <div class="doctor-item">

                <div class="doctor-info">

                    <div class="doctor-avatar">
                        ${escapeHTML(getInitials(name))}
                    </div>

                    <div>
                        <strong>${escapeHTML(getDoctorDisplayName(name))}</strong>
                        <span>
                            ${data.today} today · ${data.total} total appointments
                        </span>
                    </div>

                </div>

                <span class="availability-badge ${badgeClass}">
                    ${label}
                </span>

            </div>
        `;
    }).join("");
}

// 6. APPOINTMENT HISTORY
function getHistoryAppointments(appointments) {
    const today = getTodayKey();

    return appointments.filter(appointment => {
        const status = normalizeStatus(appointment.status);
        const appointmentDate = getLocalDateKey(getAppointmentDate(appointment));

        // Include all completed/cancelled appointments,
        // plus appointments whose dates are in the past.
        return status === "Completed" ||
               status === "Cancelled" ||
               (appointmentDate && appointmentDate < today);
    }).sort((a, b) => {
        const dateA = new Date(getAppointmentDate(a)).getTime() || 0;
        const dateB = new Date(getAppointmentDate(b)).getTime() || 0;

        return dateB - dateA;
    });
}

function updateAppointmentHistory(appointments) {
    const history = getHistoryAppointments(appointments);

    const completed = history.filter(a =>
        normalizeStatus(a.status) === "Completed"
    ).length;

    const cancelled = history.filter(a =>
        normalizeStatus(a.status) === "Cancelled"
    ).length;

    document.getElementById("historyTotal").textContent = history.length;
    document.getElementById("historyCompleted").textContent = completed;
    document.getElementById("historyCancelled").textContent = cancelled;

    renderHistoryTable();
}

function renderHistoryTable() {
    const container = document.getElementById("historyAppointments");

    if (!container) return;

    const search = (
        document.getElementById("historySearch")?.value || ""
    ).trim().toLowerCase();

    const filter = document.getElementById("historyFilter")?.value || "All";

    let history = getHistoryAppointments(allAppointments);

    if (filter !== "All") {
        history = history.filter(a =>
            normalizeStatus(a.status) === filter
        );
    }

    if (search) {
        history = history.filter(appointment => {
            const patient = String(appointment.patientName || "").toLowerCase();
            const doctor = getDoctorDisplayName(appointment.doctorName).toLowerCase();
            const id = String(appointment.appointmentId || "").toLowerCase();

            return patient.includes(search) ||
                   doctor.includes(search) ||
                   id.includes(search);
        });
    }

    document.getElementById("historyCount").textContent =
        `Showing ${history.length} records`;

    if (!history.length) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="history-empty">
                    No matching history records found.
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = history.map(appointment => {
        const status = normalizeStatus(appointment.status);
        const statusClass = status.toLowerCase();

        return `
            <tr>

                <td>
                    <span class="appointment-code">
                        ${escapeHTML(appointment.appointmentId || "—")}
                    </span>
                </td>

                <td>
                    <strong>
                        ${escapeHTML(appointment.patientName || "Unknown")}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(getDoctorDisplayName(appointment.doctorName))}
                </td>

                <td>${formatDate(getAppointmentDate(appointment))}</td>

                <td>
                    <span class="dashboard-status ${statusClass}">
                        ${status}
                    </span>
                </td>

                <td>
                    <a class="table-action"
                       href="details.html?id=${encodeURIComponent(appointment.appointmentId || "")}">
                        View →
                    </a>
                </td>

            </tr>
        `;
    }).join("");
}

// 7. CHART DEFAULTS
if (typeof Chart !== "undefined") {
    Chart.defaults.font.family =
        "'Plus Jakarta Sans', -apple-system, sans-serif";

    Chart.defaults.color = CLINIC_COLORS.text;
    Chart.defaults.plugins.legend.display = false;
}

// 8. ACTIVITY LINE CHART
function createActivityChart(appointments) {
    const canvas = document.getElementById("activityChart");

    if (!canvas || typeof Chart === "undefined") return;

    const grouped = {};

    appointments.forEach(appointment => {
        const date = getLocalDateKey(getAppointmentDate(appointment));

        if (!date) return;

        grouped[date] = (grouped[date] || 0) + 1;
    });

    const sortedDates = Object.keys(grouped).sort();

    const labels = sortedDates.map(key => {
        return new Date(key + "T00:00:00").toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short"
        });
    });

    const values = sortedDates.map(key => grouped[key]);

    if (activityChart) activityChart.destroy();

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);

    gradient.addColorStop(0, "rgba(13, 148, 136, 0.28)");
    gradient.addColorStop(0.7, "rgba(13, 148, 136, 0.04)");
    gradient.addColorStop(1, "rgba(13, 148, 136, 0)");

    activityChart = new Chart(ctx, {
        type: "line",

        data: {
            labels,

            datasets: [{
                label: "Appointments",
                data: values,
                borderColor: CLINIC_COLORS.teal,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                borderWidth: 2.5,
                pointBackgroundColor: "#ffffff",
                pointBorderColor: CLINIC_COLORS.teal,
                pointBorderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                tooltip: {
                    backgroundColor: CLINIC_COLORS.dark,
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            },

            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { font: { size: 11 } }
                },

                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        font: { size: 11 }
                    },
                    grid: {
                        color: CLINIC_COLORS.grid,
                        drawTicks: false
                    },
                    border: { display: false }
                }
            }
        }
    });
}

// 9. STATUS DOUGHNUT CHART
function createStatusChart(appointments) {
    const canvas = document.getElementById("statusChart");

    if (!canvas || typeof Chart === "undefined") return;

    const scheduled = appointments.filter(a =>
        normalizeStatus(a.status) === "Scheduled"
    ).length;

    const completed = appointments.filter(a =>
        normalizeStatus(a.status) === "Completed"
    ).length;

    const cancelled = appointments.filter(a =>
        normalizeStatus(a.status) === "Cancelled"
    ).length;

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: ["Scheduled", "Completed", "Cancelled"],

            datasets: [{
                data: [scheduled, completed, cancelled],
                backgroundColor: [
                    CLINIC_COLORS.blue,
                    CLINIC_COLORS.green,
                    CLINIC_COLORS.red
                ],
                borderWidth: 3,
                borderColor: "#ffffff",
                hoverOffset: 6,
                spacing: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",

            plugins: {
                tooltip: {
                    backgroundColor: CLINIC_COLORS.dark,
                    padding: 10,
                    cornerRadius: 8,

                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.raw}`
                    }
                }
            }
        }
    });
}

// 10. DOCTOR-WISE BAR CHART
function createDoctorChart(appointments) {
    const canvas = document.getElementById("doctorChart");

    if (!canvas || typeof Chart === "undefined") return;

    const doctorCounts = {};

    appointments.forEach(appointment => {
        const doctor = getDoctorDisplayName(appointment.doctorName);

        doctorCounts[doctor] = (doctorCounts[doctor] || 0) + 1;
    });

    const doctors = Object.entries(doctorCounts)
        .sort((a, b) => b[1] - a[1]);

    const labels = doctors.map(item => item[0]);
    const values = doctors.map(item => item[1]);

    if (doctorChart) doctorChart.destroy();

    const chartColors = [
        "#0d9488",
        "#0284c7",
        "#6366f1",
        "#10b981",
        "#8b5cf6",
        "#f59e0b"
    ];

    doctorChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,

            datasets: [{
                label: "Appointments",
                data: values,

                backgroundColor: labels.map(
                    (_, i) => chartColors[i % chartColors.length]
                ),

                borderRadius: 7,
                borderSkipped: false,
                maxBarThickness: 40
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                tooltip: {
                    backgroundColor: CLINIC_COLORS.dark,
                    padding: 10,
                    cornerRadius: 8
                }
            },

            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        font: { size: 11, weight: "600" }
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        font: { size: 10 }
                    },

                    grid: {
                        color: CLINIC_COLORS.grid,
                        drawTicks: false
                    },

                    border: { display: false }
                }
            }
        }
    });
}

// 11. HISTORY SEARCH AND FILTER
document.getElementById("historySearch")?.addEventListener("input", () => {
    renderHistoryTable();
});

document.getElementById("historyFilter")?.addEventListener("change", () => {
    renderHistoryTable();
});

// 12. INITIALIZE DASHBOARD
document.addEventListener("DOMContentLoaded", () => {

    updateDate();

    loadDashboard();

    // Refresh dashboard every 30 seconds.
    setInterval(loadDashboard, 30000);

});