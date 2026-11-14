/* Shared XO Clinic sidebar. Keep navigation and branding identical across pages. */
(() => {
    const mount = document.getElementById("sidebarMount");
    if (!mount) return;

    const currentPage = document.body.dataset.page || "";
    const links = [
        {
            page: "dashboard",
            href: "dashboard.html",
            label: "Dashboard",
            icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
        },
        {
            page: "appointments",
            href: "appointments.html",
            label: "Appointments",
            icon: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'
        },
        {
            page: "new-appointment",
            href: "add-appointment.html",
            label: "New appointment",
            icon: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>'
        },
        {
            page: "history",
            href: "appointment-history.html",
            label: "Appointment history",
            icon: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3 2"></path>'
        }
    ];

    const navMarkup = links.map(item => {
        const active = currentPage === item.page;
        return `
            <a href="${item.href}" class="nav-link${active ? " active" : ""}"${active ? ' aria-current="page"' : ""}>
                <span class="nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round"
                         aria-hidden="true">${item.icon}</svg>
                </span>
                <span>${item.label}</span>
            </a>`;
    }).join("");

    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.innerHTML = `
        <a class="brand" href="dashboard.html" aria-label="XO Clinic dashboard">
            <div class="brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </div>
            <div class="brand-name">
                XO <span>Clinic</span>
                <small>CARE • ORGANIZED</small>
            </div>
        </a>

        <p class="sidebar-label">WORKSPACE</p>
        <nav class="sidebar-nav" aria-label="Main navigation">
            ${navMarkup}
        </nav>

        <p class="sidebar-label">QUICK ACCESS</p>
        <nav class="sidebar-nav" aria-label="Quick access">
            <a href="appointments.html" class="nav-link">
                <span class="nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round"
                         aria-hidden="true">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
                <span>Find patients</span>
            </a>
        </nav>

        <div class="sidebar-bottom">
            <div class="sidebar-help-icon">✦</div>
            <div>
                <strong>XO Clinic</strong>
                <p>A little more care, every day.</p>
            </div>
        </div>
    `;

    mount.replaceWith(sidebar);
})();
