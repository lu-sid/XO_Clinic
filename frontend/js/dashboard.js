
const API_URL = "http://localhost:5000/api/appointments";

let activityChart = null;
let statusChart = null;
let doctorChart = null;

const XO_COLORS = {
    plum: "#94617f",
    rose: "#d58ba8",
    lavender: "#c5afd9",
    blue: "#819bb8",
    green: "#7da58e",
    red: "#c77d89",
    grid: "#eee9ef",
    text: "#938a98",
    dark: "#2b2331"
};

// DATE HEADER
function updateDate() {
    const dateElement = document.getElementById("currentDate");
    if (!dateElement) return;

    dateElement.textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// HTML SAFETY
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "—";

    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
    const date = dateOnly
        ? new Date(`${value}T00:00:00`)
        : new Date(value);

    if (Number.isNaN(date.getTime())) return escapeHTML(value);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getAppointmentDate(appointment) {
    return appointment.appointmentDate || appointment.createdAt || "";
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

        updateStatistics(appointments);
        updateRecentAppointments(appointments);
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
                        Please check that your backend server is running.
                    </td>
                </tr>
            `;
        }

        [
            "totalCount", "scheduledCount",
            "completedCount", "cancelledCount"
        ].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = "—";
        });

        [
            "legendScheduled", "legendCompleted", "legendCancelled"
        ].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = "—";
        });

        const chartTotal = document.getElementById("chartTotal");
        if (chartTotal) chartTotal.textContent = "—";
    }
}

// STATISTICS
function updateStatistics(appointments) {
    const counts = {
        Scheduled: appointments.filter(a => a.status === "Scheduled").length,
        Completed: appointments.filter(a => a.status === "Completed").length,
        Cancelled: appointments.filter(a => a.status === "Cancelled").length
    };

    const values = {
        totalCount: appointments.length,
        scheduledCount: counts.Scheduled,
        completedCount: counts.Completed,
        cancelledCount: counts.Cancelled,
        legendScheduled: counts.Scheduled,
        legendCompleted: counts.Completed,
        legendCancelled: counts.Cancelled,
        chartTotal: appointments.length
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// RECENT APPOINTMENTS
function updateRecentAppointments(appointments) {
    const container = document.getElementById("recentAppointments");
    if (!container) return;

    if (!appointments.length) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    No appointments found yet.
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
        const status = String(appointment.status || "Scheduled");
        const statusClass = status.toLowerCase().replace(/[^a-z0-9_-]/g, "");

        return `
            <tr>
                <td>
                    <span class="appointment-code">
                        ${escapeHTML(appointment.appointmentId)}
                    </span>
                </td>
                <td>
                    <div class="patient-cell">
                        <div class="patient-avatar">${initials}</div>
                        <span class="patient-name">
                            ${escapeHTML(appointment.patientName)}
                        </span>
                    </div>
                </td>
                <td>
                    <span class="doctor-name">
                        ${escapeHTML(appointment.doctorName)}
                    </span>
                </td>
                <td>${formatDate(getAppointmentDate(appointment))}</td>
                <td>
                    <span class="dashboard-status ${statusClass}">
                        ${escapeHTML(status)}
                    </span>
                </td>
                <td>
                    <a class="table-action"
                       href="details.html?id=${encodeURIComponent(appointment.appointmentId)}">
                        View <span>→</span>
                    </a>
                </td>
            </tr>
        `;
    }).join("");
}

// CHART DEFAULTS
if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = XO_COLORS.text;
    Chart.defaults.plugins.legend.display = false;
}

// ACTIVITY CHART
function createActivityChart(appointments) {
    const canvas = document.getElementById("activityChart");
    if (!canvas || typeof Chart === "undefined") return;

    const grouped = {};

    appointments.forEach(appointment => {
        const rawDate = getAppointmentDate(appointment);
        if (!rawDate) return;

        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))
            ? new Date(`${rawDate}T00:00:00`)
            : new Date(rawDate);

        if (Number.isNaN(date.getTime())) return;

        const key = date.toISOString().slice(0, 10);
        grouped[key] = (grouped[key] || 0) + 1;
    });

    const sortedDates = Object.keys(grouped).sort();

    const labels = sortedDates.map(key => {
        return new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short"
        });
    });

    const values = sortedDates.map(key => grouped[key]);

    if (activityChart) activityChart.destroy();

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(177, 119, 151, 0.25)");
    gradient.addColorStop(1, "rgba(177, 119, 151, 0.015)");

    activityChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Appointments",
                data: values,
                borderColor: XO_COLORS.plum,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                borderWidth: 2.7,
                pointBackgroundColor: "#ffffff",
                pointBorderColor: XO_COLORS.plum,
                pointBorderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: XO_COLORS.dark,
                    titleColor: "#ffffff",
                    bodyColor: "#f3eaf0",
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: XO_COLORS.text, font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        color: XO_COLORS.text,
                        font: { size: 10 },
                        padding: 9
                    },
                    grid: { color: XO_COLORS.grid, drawTicks: false },
                    border: { display: false }
                }
            }
        }
    });
}

// STATUS DOUGHNUT CHART
function createStatusChart(appointments) {
    const canvas = document.getElementById("statusChart");
    if (!canvas || typeof Chart === "undefined") return;

    const scheduled = appointments.filter(a => a.status === "Scheduled").length;
    const completed = appointments.filter(a => a.status === "Completed").length;
    const cancelled = appointments.filter(a => a.status === "Cancelled").length;

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Scheduled", "Completed", "Cancelled"],
            datasets: [{
                data: [scheduled, completed, cancelled],
                backgroundColor: [
                    XO_COLORS.blue,
                    XO_COLORS.green,
                    XO_COLORS.red
                ],
                borderWidth: 0,
                hoverOffset: 7,
                spacing: 4,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "76%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: XO_COLORS.dark,
                    titleColor: "#ffffff",
                    bodyColor: "#f3eaf0",
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: context => ` ${context.label}: ${context.raw}`
                    }
                }
            }
        }
    });
}

// DOCTOR-WISE BAR CHART
function createDoctorChart(appointments) {
    const canvas = document.getElementById("doctorChart");
    if (!canvas || typeof Chart === "undefined") return;

    const doctorCounts = {};

    appointments.forEach(appointment => {
        const doctor = appointment.doctorName || "Unassigned";
        doctorCounts[doctor] = (doctorCounts[doctor] || 0) + 1;
    });

    const doctors = Object.entries(doctorCounts).sort((a, b) => b[1] - a[1]);
    const labels = doctors.map(item => item[0]);
    const values = doctors.map(item => item[1]);

    if (doctorChart) doctorChart.destroy();

    const chartColors = [
        "#94617f", "#bd88a2", "#d4a9bc",
        "#8e9fba", "#a7b9ad", "#c58b91"
    ];

    doctorChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Appointments",
                data: values,
                backgroundColor: labels.map((_, index) =>
                    chartColors[index % chartColors.length]
                ),
                borderRadius: 7,
                maxBarThickness: 58,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: XO_COLORS.dark,
                    titleColor: "#ffffff",
                    bodyColor: "#f3eaf0",
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: XO_COLORS.text,
                        font: { size: 10, weight: "600" }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        color: XO_COLORS.text,
                        font: { size: 9 }
                    },
                    grid: { color: XO_COLORS.grid, drawTicks: false },
                    border: { display: false }
                }
            }
        }
    });
}

// INITIALIZE DASHBOARD
document.addEventListener("DOMContentLoaded", () => {
    updateDate();
    loadDashboard();
    setInterval(loadDashboard, 30000);
});
