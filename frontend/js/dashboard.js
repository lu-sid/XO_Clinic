
const API_URL = 'http://localhost:5000/api/appointments';

let activityChart = null;
let statusChart = null;
let doctorChart = null;


// ============================================
// DATE HEADER
// ============================================

function updateDate() {

    const today = new Date();

    document.getElementById('currentDate').textContent =
        today.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
}


// ============================================
// HTML SAFETY
// ============================================

function escapeHTML(value) {

    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

}


// ============================================
// LOAD DASHBOARD DATA
// ============================================

async function loadDashboard() {

    const recentContainer =
        document.getElementById('recentAppointments');

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        const appointments = data.appointments || [];

        updateStatistics(appointments);
        updateRecentAppointments(appointments);
        createActivityChart(appointments);
        createStatusChart(appointments);
        createDoctorChart(appointments);

    } catch (error) {

        console.error('Dashboard loading error:', error);

        recentContainer.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Unable to load dashboard data.
                    Please check your backend server.
                </td>
            </tr>
        `;

        ['totalCount', 'scheduledCount',
         'completedCount', 'cancelledCount'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });

    }

}


// ============================================
// STATISTICS
// ============================================

function updateStatistics(appointments) {

    const total = appointments.length;

    const scheduled = appointments.filter(
        a => a.status === 'Scheduled'
    ).length;

    const completed = appointments.filter(
        a => a.status === 'Completed'
    ).length;

    const cancelled = appointments.filter(
        a => a.status === 'Cancelled'
    ).length;


    document.getElementById('totalCount').textContent = total;

    document.getElementById('scheduledCount').textContent = scheduled;

    document.getElementById('completedCount').textContent = completed;

    document.getElementById('cancelledCount').textContent = cancelled;


    // Status chart legend

    document.getElementById('legendScheduled').textContent = scheduled;

    document.getElementById('legendCompleted').textContent = completed;

    document.getElementById('legendCancelled').textContent = cancelled;

}


// ============================================
// RECENT APPOINTMENTS TABLE
// ============================================

function updateRecentAppointments(appointments) {

    const container =
        document.getElementById('recentAppointments');


    if (appointments.length === 0) {

        container.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    No appointments found.
                </td>
            </tr>
        `;

        return;
    }


    // Sort by creation time, newest first

    const recent = [...appointments]
        .sort((a, b) => {
            return new Date(b.createdAt || b.appointmentDate)
                - new Date(a.createdAt || a.appointmentDate);
        })
        .slice(0, 6);


    container.innerHTML = recent.map(a => {

        const initials = escapeHTML(
            a.patientName
                .split(' ')
                .filter(Boolean)
                .map(word => word[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
        );

        const date = new Date(a.appointmentDate)
            .toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });


        return `

            <tr>

                <td>
                    <span class="appointment-code">
                        ${escapeHTML(a.appointmentId)}
                    </span>
                </td>

                <td>
                    <div class="patient-cell">

                        <div class="patient-avatar">
                            ${initials}
                        </div>

                        <span class="patient-name">
                            ${escapeHTML(a.patientName)}
                        </span>

                    </div>
                </td>

                <td>
                    <span class="doctor-name">
                        ${escapeHTML(a.doctorName)}
                    </span>
                </td>

                <td>${date}</td>

                <td>
                    <span class="dashboard-status ${escapeHTML(a.status)}">
                        ${escapeHTML(a.status)}
                    </span>
                </td>

                <td>
                    <a class="table-action"
                       href="details.html?id=${encodeURIComponent(a.appointmentId)}">
                        View →
                    </a>
                </td>

            </tr>

        `;

    }).join('');

}


// ============================================
// CHART DEFAULT SETTINGS
// ============================================

Chart.defaults.font.family = "'DM Sans', sans-serif";

Chart.defaults.color = '#8998a4';

Chart.defaults.plugins.legend.display = false;


// ============================================
// 1. APPOINTMENT ACTIVITY CHART
// ============================================

function createActivityChart(appointments) {

    const grouped = {};

    appointments.forEach(a => {

        const date = new Date(a.appointmentDate);

        const key = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });

        grouped[key] = (grouped[key] || 0) + 1;

    });


    const labels = Object.keys(grouped);

    const values = Object.values(grouped);


    const ctx = document.getElementById('activityChart');


    if (activityChart) {
        activityChart.destroy();
    }


    activityChart = new Chart(ctx, {

        type: 'line',

        data: {

            labels: labels,

            datasets: [{

                label: 'Appointments',

                data: values,

                borderColor: '#07858a',

                backgroundColor: 'rgba(7,133,138,0.10)',

                fill: true,

                tension: 0.4,

                borderWidth: 3,

                pointBackgroundColor: '#07858a',

                pointBorderColor: '#ffffff',

                pointBorderWidth: 3,

                pointRadius: 5,

                pointHoverRadius: 7

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: 'index'
            },

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    backgroundColor: '#172d40',

                    padding: 12,

                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },

                    bodyFont: {
                        size: 12
                    },

                    displayColors: false

                }

            },

            scales: {

                x: {

                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        font: {
                            size: 10
                        }
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        font: {
                            size: 10
                        }
                    },

                    grid: {
                        color: '#edf1f3',
                        drawTicks: false
                    },

                    border: {
                        display: false,
                        dash: [4, 4]
                    }

                }

            }

        }

    });

}


// ============================================
// 2. APPOINTMENT STATUS DOUGHNUT CHART
// ============================================

function createStatusChart(appointments) {

    const scheduled = appointments.filter(
        a => a.status === 'Scheduled'
    ).length;

    const completed = appointments.filter(
        a => a.status === 'Completed'
    ).length;

    const cancelled = appointments.filter(
        a => a.status === 'Cancelled'
    ).length;


    const ctx = document.getElementById('statusChart');


    if (statusChart) {
        statusChart.destroy();
    }


    statusChart = new Chart(ctx, {

        type: 'doughnut',

        data: {

            labels: [
                'Scheduled',
                'Completed',
                'Cancelled'
            ],

            datasets: [{

                data: [scheduled, completed, cancelled],

                backgroundColor: [
                    '#568acb',
                    '#269b72',
                    '#dc7474'
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

            cutout: '73%',

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    backgroundColor: '#172d40',

                    padding: 12,

                    callbacks: {

                        label: function(context) {

                            return ` ${context.label}: ${context.raw}`;

                        }

                    }

                }

            }

        }

    });

}


// ============================================
// 3. DOCTOR-WISE APPOINTMENT BAR CHART
// ============================================

function createDoctorChart(appointments) {

    const doctorCounts = {};


    appointments.forEach(a => {

        doctorCounts[a.doctorName] =
            (doctorCounts[a.doctorName] || 0) + 1;

    });


    const labels = Object.keys(doctorCounts);

    const values = Object.values(doctorCounts);


    const ctx = document.getElementById('doctorChart');


    if (doctorChart) {
        doctorChart.destroy();
    }


    doctorChart = new Chart(ctx, {

        type: 'bar',

        data: {

            labels: labels,

            datasets: [{

                label: 'Appointments',

                data: values,

                backgroundColor: [
                    '#07858a',
                    '#5ba9a5',
                    '#a4d5cd',
                    '#568acb',
                    '#d89a43'
                ],

                borderRadius: 8,

                maxBarThickness: 65,

                borderSkipped: false

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    backgroundColor: '#172d40',

                    padding: 12

                }

            },

            scales: {

                x: {

                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        font: {
                            size: 11,
                            weight: '600'
                        }
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {
                        precision: 0,
                        stepSize: 1
                    },

                    grid: {
                        color: '#edf1f3',
                        drawTicks: false
                    },

                    border: {
                        display: false,
                        dash: [4, 4]
                    }

                }

            }

        }

    });

}

updateDate();

loadDashboard();

setInterval(loadDashboard, 30000);