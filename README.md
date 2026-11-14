# XO Clinic – Clinic Appointment Management System

**XO Clinic** is a web-based Clinic Appointment Management System developed to simplify and organize the process of managing patient appointments. The system provides a centralized dashboard where clinic staff can view appointment statistics, monitor appointment statuses, and manage patient appointment records efficiently.

The project uses MongoDB as its database and a Node.js and Express.js backend to handle application requests. The frontend provides a clean, responsive interface for interacting with the system.

## Features

### 1. Dashboard
- View the total number of appointments.
- Monitor scheduled, completed, and cancelled appointments.
- Visualize appointment activity through charts.
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

### 3. Database Management
- Store appointment records in MongoDB.
- Perform CRUD operations using Mongoose.
- Retrieve and update appointment information through REST API endpoints.

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
│   ├── routes/
│   │   └── appointmentRoutes.js
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
        ├── dashboard.js
        ├── appointment.js
        ├── form.js
        └── details.js
```

## Installation and Setup

### Prerequisites

Make sure you have the following installed:

- Node.js
- MongoDB Community Server or MongoDB Atlas
- MongoDB Compass (optional, for database visualization)
- Visual Studio Code
- Live Server extension

### 1. Clone the Repository

```bash
git clone https://github.com/lu-sid/Clinic-Appointment-Management-System-.git
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

The application will open in your browser.

## API Endpoints

The backend provides REST API endpoints for appointment management.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/appointments` | Retrieve all appointments |
| GET | `/api/appointments/:id` | Retrieve an appointment by ID |
| POST | `/api/appointments` | Create a new appointment |
| PUT | `/api/appointments/:id` | Update an appointment |
| DELETE | `/api/appointments/:id` | Delete an appointment |

## Database

The application uses MongoDB to store appointment records.

**Database Name:** `clinic_appointment_db`

**Collection:** `appointments`

Mongoose is used to define the appointment schema and interact with the MongoDB database. Each appointment record contains the relevant patient, doctor, appointment date, time, and status information.

## Future Enhancements

The following features can be incorporated in future versions:

- Patient management module.
- Doctor and staff management.
- Patient registration and authentication.
- Appointment reminders and notifications.
- Advanced search and filtering.
- Prescription and medical history management.
- Role-based access control for administrators and clinic staff.

## Learning Outcomes

Through this project, practical experience is gained in:

- Developing a full-stack web application.
- Implementing CRUD operations.
- Designing and integrating REST APIs.
- Connecting Node.js applications with MongoDB.
- Using Mongoose for database operations.
- Creating interactive dashboards using Chart.js.
- Organizing frontend and backend project structures.

## Author

**Developed as a Mini Project**

**Project Name:** XO Clinic – Clinic Appointment Management System

**Domain:** Web Development and Database Management