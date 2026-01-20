// course_form.js

// === Tutor Booking ===
let currentTutor = null;
let tutorEditOrder = null;
let tutorTotalPrice = 0;

function calculateTutorPrice() { /* ... */ }
function openTutorRequestModal(tutor, order = null) { /* ... */ }

// === Course Enrollment ===
let currentCourse = null;
let courseEditOrder = null;
let courseTotalPrice = 0;

function calculatePrice() { /* ... */ }
function openEnrollmentModal(course, order = null) { /* ... */ }

// === Event Listeners ===
document.getElementById('tutor_duration')?.addEventListener('input', calculateTutorPrice);
document.getElementById('tutor-request-form')?.addEventListener('submit', handleTutorSubmit);
// ... и т.д.