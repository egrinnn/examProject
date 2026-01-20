// === Data Storage ===
let courseCatalog = [];
let displayedCourses = [];
let tutorRoster = [];
let displayedTutors = [];

// === Pagination & UI State ===
let activePage = 1;
const coursesPerPage = 5;

let currentSelectedCourse = null;

// === DOM References (with updated IDs from new HTML) ===
const courseGrid = document.getElementById('courses-list');
const pageNav = document.getElementById('courses-pagination');
const courseSearchPanel = document.getElementById('course-search-form');

// === Fetch all course and tutor data ===
async function loadAllData() {
    try {
        courseCatalog = await fetchCourses();
        displayedCourses = [...courseCatalog];

        tutorRoster = await fetchTutors();
        displayedTutors = [...tutorRoster];
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

// === Render course cards with pagination ===
function displayCourseCards() {
    courseGrid.innerHTML = '';

    const startIndex = (activePage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const visibleCourses = displayedCourses.slice(startIndex, endIndex);

    if (visibleCourses.length === 0) {
        courseGrid.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No matching courses found.</p>
            </div>
        `;
        return;
    }

    visibleCourses.forEach(course => {
        const cardHTML = `
            <div class="col course-item" data-courseId="${course.id}">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${course.name}</h5>
                        <p class="card-text text-muted small">
                            ${course.description || 'Description not available.'}
                        </p>
                        <div class="mt-auto">
                            <p class="fw-bold mb-2">
                                Level: 
                                <span class="badge bg-info text-dark">
                                    ${course.level || 'Any'}
                                </span>
                            </p>
                            <button class="btn btn-primary w-100 mt-2 order-course-btn">
                                Enroll Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        courseGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// === Render pagination controls ===
function buildPagination() {
    pageNav.innerHTML = '';
    const totalPages = Math.ceil(displayedCourses.length / coursesPerPage);

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const listItem = document.createElement('li');
        listItem.className = `page-item ${pageNum === activePage ? 'active' : ''}`;
        listItem.innerHTML = `<a class="page-link" href="#">${pageNum}</a>`;
        listItem.addEventListener('click', (e) => {
            e.preventDefault();
            activePage = pageNum;
            displayCourseCards();
            buildPagination();
        });
        pageNav.appendChild(listItem);
    }
}

// === Apply course filters (name + level) ===
function applyCourseFilters() {
    const nameInput = document.getElementById('course-name').value.toLowerCase().trim();
    const levelSelection = document.getElementById('course-level').value;

    displayedCourses = courseCatalog.filter(course => {
        const nameMatches = course.name.toLowerCase().includes(nameInput);
        const levelMatches = !levelSelection ||
            (course.level && course.level.toLowerCase() === levelSelection);
        return nameMatches && levelMatches;
    });

    activePage = 1;
    displayCourseCards();
    buildPagination();
}

// === Handle course enrollment click ===
function onCourseCardClick(event) {
    if (!event.target.classList.contains('order-course-btn')) return;

    const courseElement = event.target.closest('.course-item');
    const courseId = courseElement.dataset.courseid;
    const matchedCourse = courseCatalog.find(c => c.id == courseId);

    if (matchedCourse) {
        openEnrollmentModal(matchedCourse);
    }
}

// === Render tutor table rows ===
function displayTutorList() {
    const tableBody = document.getElementById('tutors-list');
    tableBody.innerHTML = '';

    if (displayedTutors.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    No tutors match your filters.
                </td>
            </tr>
        `;
        return;
    }

    displayedTutors.forEach(tutor => {
        const row = `
            <tr data-tutorid="${tutor.id}">
                <td>
                    <img src="assets/icons/tutor.svg" width="24" height="24" class="me-2">
                    ${tutor.name}
                </td>
                <td>${tutor.language_level}</td>
                <td>${tutor.languages_spoken.join(', ')}</td>
                <td>${tutor.work_experience} years</td>
                <td>${new Intl.NumberFormat('en-US').format(tutor.price_per_hour)} RUB/h</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary request-tutor-btn">
                        Select
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

// === Apply tutor filters (qualification + experience) ===
function applyTutorFilters() {
    const qualFilter = document.getElementById('tutor-qualification').value;
    const minExp = parseInt(document.getElementById('tutor-experience').value) || 0;

    displayedTutors = tutorRoster.filter(tutor => {
        const qualOk = !qualFilter ||
            (tutor.language_level && tutor.language_level.toLowerCase() === qualFilter);
        const expOk = tutor.work_experience >= minExp;
        return qualOk && expOk;
    });

    displayTutorList();
}

// === Row highlighting on tutor table click ===
document.getElementById('tutors-list')?.addEventListener('click', function (e) {
    const clickedRow = e.target.closest('tr');
    if (!clickedRow) return;

    // Remove highlight from all rows
    this.querySelectorAll('tr').forEach(row => {
        row.classList.remove('table-primary');
    });

    // Highlight clicked row
    clickedRow.classList.add('table-primary');
});

// === Tutor selection handler ===
document.getElementById('tutors-list')?.addEventListener('click', (e) => {
    const selectBtn = e.target.closest('.request-tutor-btn');
    if (selectBtn) {
        const tutorId = parseInt(selectBtn.closest('tr').dataset.tutorid, 10);
        const selectedTutor = tutorRoster.find(t => t.id === tutorId);
        if (selectedTutor) {
            openTutorRequestModal(selectedTutor);
        }
    }
});

// === Initialize on page load ===
async function initializeApp() {
    await loadAllData();

    displayCourseCards();
    buildPagination();
    displayTutorList();
}

// === Event Listeners ===
courseGrid?.addEventListener('click', onCourseCardClick);

document.querySelector('#course-search-form button')?.addEventListener('click', applyCourseFilters);
document.querySelector('#tutor-filter-form button')?.addEventListener('click', applyTutorFilters);

// Start everything
document.addEventListener('DOMContentLoaded', initializeApp);