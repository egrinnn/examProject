// reg_form.js — ONLY for index.html

// Проверяем, есть ли модальное окно на странице
if (!document.getElementById('enrollmentModal')) {
    // На других страницах (например, orders.html) — не запускаем логику
    console.log('Enrollment form not found. Skipping reg_form.js initialization.');
    // Выход без ошибок
} else {
    let currentCourse = null;
    let courseEditOrder = null;
    let courseTotalPrice = 0;

    function isEarly(date) {
        const diffTime = date.getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 30;
    }

    function calculatePrice() {
        if (!currentCourse) return;

        const feePerHour = currentCourse.course_fee_per_hour;
        const totalHours = currentCourse.week_length * currentCourse.total_length;
        let courseCost = feePerHour * totalHours;

        const dateValue = document.getElementById('date_start').value;
        if (dateValue) {
            const date = new Date(dateValue);
            const day = date.getDay();
            if (day === 0 || day === 6) { // выходные
                courseCost *= 1.5;
            }
            if (isEarly(date)) {
                courseCost *= 0.9; // скидка за раннюю запись
            }
        }

        const timeValue = document.getElementById('time_start').value;
        if (timeValue) {
            const [hour] = timeValue.split(':').map(Number);
            if (hour >= 9 && hour < 12) {
                courseCost += 400;
            } else if (hour >= 18 && hour <= 20) {
                courseCost += 1000;
            }
        }

        let persons = parseInt(document.getElementById('persons').value) || 1;
        const form = document.getElementById('enrollment-form');

        if (form?.intensive_course?.checked) {
            courseCost *= 1.2;
        }
        if (form?.excursions?.checked) {
            courseCost *= 1.25;
        }

        let total = courseCost * persons;

        if (form?.supplementary?.checked) {
            total += 2000 * persons;
        }
        if (form?.personalized?.checked) {
            total += 1500 * currentCourse.total_length;
        }
        if (persons >= 5) {
            total *= 0.85; // скидка для групп
        }

        courseTotalPrice = total;

        const totalEl = document.getElementById('total_price');
        if (totalEl) {
            totalEl.textContent = Math.round(total).toLocaleString('ru-RU');
        }
    }

    function updateTimeOptions(selectedDate) {
        if (!selectedDate || !currentCourse) return;

        const timeSelect = document.getElementById('time_start');
        if (!timeSelect) return;

        timeSelect.disabled = false;
        timeSelect.innerHTML = '<option value="" disabled selected>Выберите время...</option>';

        const slots = currentCourse.start_dates
            .filter(dateStr => dateStr.split("T")[0] === selectedDate)
            .map(dateStr => dateStr.split("T")[1].slice(0, 5))
            .sort((a, b) => a.localeCompare(b));

        slots.forEach(time => {
            timeSelect.insertAdjacentHTML('beforeend',
                `<option value="${time}">${time}</option>`
            );
        });

        const weeks = currentCourse.total_length;
        const startDate = new Date(selectedDate);
        const endDate = new Date(startDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
        const endDisplay = document.getElementById('display_end_date');
        if (endDisplay) {
            endDisplay.textContent = endDate.toLocaleDateString('ru-RU');
        }
    }

    function openEnrollmentModal(course, order = null) {
        courseEditOrder = order;
        currentCourse = course;

        const form = document.getElementById('enrollment-form');
        if (form) form.reset();

        document.getElementById('course_id').value = course.id;
        document.getElementById('course_name_display').textContent = course.name;
        document.getElementById('teacher_name_display').textContent = course.teacher || '—';

        const durationEl = document.getElementById('display_duration');
        if (durationEl) {
            durationEl.textContent = course.total_length;
        }

        const dateSelect = document.getElementById('date_start');
        if (!dateSelect) return;

        dateSelect.innerHTML = '<option value="" disabled selected>Выберите дату начала...</option>';

        const dateStrings = [...new Set(course.start_dates.map(d => d.split('T')[0]))].sort();
        dateStrings.forEach(dateStr => {
            const displayDate = new Date(dateStr).toLocaleDateString('ru-RU');
            dateSelect.insertAdjacentHTML('beforeend',
                `<option value="${dateStr}">${displayDate}</option>`
            );
        });

        const timeSelect = document.getElementById('time_start');
        if (timeSelect) {
            timeSelect.disabled = true;
            timeSelect.innerHTML = '<option value="" disabled selected>Сначала выберите дату</option>';
        }

        if (order) {
            if (order.date_start) {
                dateSelect.value = order.date_start.split('T')[0];
                updateTimeOptions(dateSelect.value);
            }
            if (order.time_start) {
                document.getElementById('time_start').value = order.time_start.slice(0, 5);
            }
            document.getElementById('persons').value = order.persons || 1;

            if (form) {
                form.intensive_course.checked = !!order.intensive_course;
                form.supplementary.checked = !!order.supplementary;
                form.personalized.checked = !!order.personalized;
                form.excursions.checked = !!order.excursions;
                form.assessment.checked = !!order.assessment;
                form.interactive.checked = !!order.interactive;
            }
        }

        calculatePrice();

        const modal = new bootstrap.Modal(document.getElementById('enrollmentModal'));
        modal.show();
    }

    // === Event Listeners (только если элементы существуют) ===
    const dateStart = document.getElementById('date_start');
    const enrollmentForm = document.getElementById('enrollment-form');
    const personsInput = document.getElementById('persons');

    if (dateStart) {
        dateStart.addEventListener('change', function (e) {
            updateTimeOptions(e.target.value);
            calculatePrice();
        });
    }

    if (enrollmentForm) {
        enrollmentForm.addEventListener('change', calculatePrice);
        enrollmentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const persons = parseInt(formData.get('persons')) || 1;
            const selectedDate = formData.get('date_start');

            const requestData = {
                course_id: parseInt(formData.get('course_id')),
                tutor_id: null,
                date_start: selectedDate,
                time_start: formData.get('time_start'),
                duration: currentCourse?.total_length || 1,
                persons: persons,
                price: courseTotalPrice,
                early_registration: selectedDate ? isEarly(new Date(selectedDate)) : false,
                group_enrollment: persons >= 5,
                intensive_course: formData.get('intensive_course') === 'on',
                supplementary: formData.get('supplementary') === 'on',
                personalized: formData.get('personalized') === 'on',
                excursions: formData.get('excursions') === 'on',
                assessment: formData.get('assessment') === 'on',
                interactive: formData.get('interactive') === 'on'
            };

            if (!requestData.date_start || !requestData.time_start) {
                showAlert('Пожалуйста, выберите дату и время начала курса.', 'danger');
                return;
            }

            try {
                let url = `${BASE_URL}/orders`;
                let method = 'POST';

                if (courseEditOrder) {
                    url += `/${courseEditOrder.id}`;
                    method = 'PUT';
                }
                url += `?api_key=${API_KEY}`;

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });

                if (response.ok) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('enrollmentModal'));
                    modal?.hide();
                    showAlert('Заявка успешно отправлена!', 'success');

                    // Обновление списка заказов, если функция доступна
                    if (typeof refreshEnrollments === 'function') {
                        await refreshEnrollments();
                    }
                } else {
                    const error = await response.json().catch(() => ({}));
                    showAlert(`Ошибка: ${error.message || 'Не удалось отправить заявку.'}`, 'danger');
                }
            } catch (err) {
                console.error(err);
                showAlert('Произошла сетевая ошибка.', 'danger');
            }
        });
    }

    if (personsInput) {
        personsInput.addEventListener('input', calculatePrice);
    }

    // Экспортируем функцию в глобальную область, чтобы main.js мог её вызвать
    window.openEnrollmentModal = openEnrollmentModal;
}