# XO Clinic – Clinic Appointment Management System

**XO Clinic** is a web-based Clinic Appointment Management System developed to simplify and organize clinic appointment management. It provides a centralized dashboard for monitoring appointment statistics and managing patient appointment records through an intuitive and user-friendly interface.

The application supports appointment creation, retrieval, modification, deletion, detailed record viewing, searching, filtering, sorting, and appointment history management. It also provides multiple ways to view appointments through a table and an interactive calendar.

The project uses **MongoDB** for database management, **Node.js and Express.js** for backend development, and **HTML, CSS, and JavaScript** for frontend development.

## Features

### 1. Dashboard

- View the total number of appointments.
- Monitor scheduled, completed, and cancelled appointments.
- Visualize appointment activity through interactive charts.
- View appointment distribution by status.
- Analyze doctor-wise appointment statistics.
- Access recently added appointments.

### 2. Appointment Management

- Add new patient appointments.
- View all appointment records.
- Update existing appointment details.
- View individual appointment information.
- Delete appointment records.
- Manage appointment statuses.
- View appointment history.

### 3. Appointment Records and History

- View and manage all appointment records from a centralized page.
- Monitor total, upcoming, past, completed, and cancelled appointments.
- Search appointments using patient names, doctor names, or appointment IDs.
- Filter appointments by doctor.
- Filter records using a date range.
- Filter appointments by status.
- Sort records by appointment date and patient name.
- Navigate through records using pagination.

### 4. Calendar View

- Switch between Table View and Calendar View.
- View appointments in **Month, Week, and Day** formats.
- Navigate between dates using Previous and Next controls.
- Quickly return to the current date using the Today button.
- View scheduled appointments directly on calendar dates.
- Identify appointment statuses using colour-coded indicators.
- View appointment details such as patient names, doctors, and appointment times.

### 5. Appointment Export and Printing

- Export appointment records as CSV files.
- Print appointment records.
- Export and print records according to the applied filters.

### 6. Shared Navigation

- Consistent sidebar across application pages.
- Quick navigation between dashboard and appointment modules.
- Active-page highlighting for easier navigation.

### 7. Database Management

- Store appointment records in MongoDB.
- Perform CRUD operations using Mongoose.
- Retrieve and update appointment information through REST API endpoints.
- Maintain appointment records using a structured document schema.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Structure of the application |
| CSS3 | Styling and responsive interface |
| JavaScript | Frontend functionality |
| Chart.js | Dashboard visualizations |
| Node.js | Backend runtime environment |
| Express.js | REST API development |
| MongoDB | Database management |
| Mongoose | MongoDB object modeling |

## Project Structure

```text
ClinicAppointmentManagement/
│
├── backend/
│   ├── models/
│   │   └── appointment.js
│   │
│   ├── routes/
│   │   └── appointmentRoutes.js
│   │
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── dashboard.html
    ├── appointments.html
    ├── add-appointment.html
    ├── details.html
    │
    ├── css/
    │   └── style.css
    │
    └── js/
        ├── sidebar.js
        ├── dashboard.js
        ├── appointment.js
        ├── appointments.js
        ├── form.js
        └── details.js
```

## Installation and Setup

### Prerequisites

Make sure you have the following installed:

- Node.js and npm
- MongoDB Community Server or MongoDB Atlas
- MongoDB Compass (optional, for database visualization)
- Visual Studio Code
- Live Server extension

### 1. Clone the Repository

```bash
git clone https://github.com/lu-sid/XO_Clinic.git
```

Navigate to the project directory:

```bash
cd ClinicAppointmentManagement
```

### 2. Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
```

Install the required dependencies:

```bash
npm install
```

### 3. Configure MongoDB

Ensure that MongoDB is running locally or configure your MongoDB Atlas connection.

The application uses the following database:

```text
clinic_appointment_db
```

Configure the MongoDB connection string in the backend configuration according to your environment.

### 4. Start the Backend Server

From the backend directory, run:

```bash
npm run dev
```

The backend server runs at:

```text
http://localhost:5000
```

The appointment API is available at:

```text
http://localhost:5000/api/appointments
```

### 5. Run the Frontend

1. Open the `frontend` folder in Visual Studio Code.
2. Open `dashboard.html`.
3. Right-click and select **Open with Live Server**.
4. Use the sidebar to navigate between the different application modules.

## API Endpoints

The backend provides REST API endpoints for appointment management.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/appointments` | Retrieve appointment records |
| GET | `/api/appointments/:id` | Retrieve an individual appointment |
| POST | `/api/appointments` | Create a new appointment |
| PUT | `/api/appointments/:id` | Update an existing appointment |
| DELETE | `/api/appointments/:id` | Delete an appointment |

## Database

The application uses MongoDB to store appointment records.

**Database Name:** `clinic_appointment_db`

**Collection:** `appointments`

Mongoose is used to define the appointment schema and interact with the MongoDB database.

Each appointment document contains:

| Field | Description |
|---|---|
| `_id` | MongoDB-generated document identifier |
| `appointmentId` | Unique appointment identifier |
| `patientName` | Patient's name |
| `doctorName` | Assigned doctor's name |
| `appointmentDate` | Appointment date |
| `appointmentTime` | Appointment time |
| `status` | Scheduled, Completed, or Cancelled |
| `reason` | Reason for consultation |
| `createdAt` | Record creation timestamp |
| `updatedAt` | Last modification timestamp |

## Future Enhancements

The following features can be incorporated in future versions:

- Patient management module.
- Doctor and staff management.
- Patient registration and authentication.
- Appointment reminders and notifications.
- Prescription and medical history management.
- Role-based access control for administrators and clinic staff.
- Doctor availability and appointment conflict detection.
- Advanced reporting and analytics.

## Learning Outcomes

Through this project, practical experience is gained in:

- Developing a full-stack web application.
- Implementing Create, Read, Update, and Delete operations.
- Designing and integrating REST APIs.
- Connecting Node.js applications with MongoDB.
- Using Mongoose for database operations.
- Creating interactive dashboards using Chart.js.
- Implementing search, filtering, sorting, and pagination.
- Developing interactive calendar interfaces.
- Exporting and printing application records.
- Organizing reusable frontend components.
- Integrating frontend pages with backend services.
- Debugging database connectivity, API routes, and frontend functionality.

## Author

**Developed as a Mini Project**

**Project Name:** XO Clinic – Clinic Appointment Management System

**Domain:** Web Development and Database Management

**GitHub Repository:** [XO Clinic](https://github.com/lu-sid/XO_Clinic)