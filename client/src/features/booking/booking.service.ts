export { createAppointmentRequest as submitBooking } from './appointment.api';
export function getBookingSteps() {
  return [
    { key: 'doctor', label: 'Select Doctor', path: '/app/doctors' },
    { key: 'date', label: 'Choose Date', path: '/app/book/date' },
    { key: 'time', label: 'Pick Time', path: '/app/book/time' },
    { key: 'review', label: 'Review', path: '/app/book/review' },
  ];
}
