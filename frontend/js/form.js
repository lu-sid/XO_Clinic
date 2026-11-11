
const API_URL = 'http://localhost:5000/api/appointments';

const form = document.getElementById('appointmentForm');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const saveButton = document.getElementById('saveButton');

const params = new URLSearchParams(window.location.search);
const editId = params.get('id');


// DISPLAY MESSAGE
function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `full ${type}-message`;
}


// LOAD EXISTING APPOINTMENT FOR EDITING
async function loadAppointment() {

    if (!editId) return;

    try {

        formTitle.textContent = 'Edit Appointment';
        saveButton.textContent = 'Update Appointment';

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(editId)}`
        );

        if (!response.ok) {
            throw new Error('Appointment not found');
        }

        const appointment = await response.json();

        form.elements['appointmentId'].value =
            appointment.appointmentId;

        form.elements['patientName'].value =
            appointment.patientName;

        form.elements['doctorName'].value =
            appointment.doctorName;

        form.elements['appointmentDate'].value =
            appointment.appointmentDate.split('T')[0];

        form.elements['appointmentTime'].value =
            appointment.appointmentTime;

        form.elements['reason'].value =
            appointment.reason;

        form.elements['status'].value =
            appointment.status;

        // Do not allow changing the ID during editing
        form.elements['appointmentId'].readOnly = true;

    } catch (error) {

        console.error(error);
        showMessage(error.message, 'error');

    }
}


// SAVE OR UPDATE APPOINTMENT
form.addEventListener('submit', async function(event) {

    event.preventDefault();

    if (!form.reportValidity()) return;

    const appointmentData = {
        appointmentId: form.elements['appointmentId'].value.trim(),
        patientName: form.elements['patientName'].value.trim(),
        doctorName: form.elements['doctorName'].value,
        appointmentDate: form.elements['appointmentDate'].value,
        appointmentTime: form.elements['appointmentTime'].value,
        reason: form.elements['reason'].value.trim(),
        status: form.elements['status'].value
    };

    const url = editId
        ? `${API_URL}/${encodeURIComponent(editId)}`
        : API_URL;

    const method = editId ? 'PUT' : 'POST';

    try {

        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to save appointment');
        }

        showMessage(
            editId
                ? 'Appointment updated successfully!'
                : 'Appointment added successfully!',
            'success'
        );

        setTimeout(() => {
            window.location.href = 'appointments.html';
        }, 1000);

    } catch (error) {

        console.error(error);
        showMessage(error.message, 'error');

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = editId
            ? 'Update Appointment'
            : 'Save Appointment';

    }

});


// INITIALIZE FORM
loadAppointment();