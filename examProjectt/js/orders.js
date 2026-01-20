// orders.js
let orders = [];
let courses = [];
let tutors = [];
let currentOrder = null;

let currentPage = 1;
const itemsPerPage = 5;

const ordersTable = document.getElementById('userOrdersList');
const paginationContainer = document.getElementById('ordersNavPagination');

function showAlert(message, type = 'info') {
    const container = document.getElementById('notification-zone');
    if (!container) return;

    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show`;
    alertEl.role = 'alert';
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    container.appendChild(alertEl);

    // Автоудаление через 5 секунд
    setTimeout(() => {
        alertEl.remove();
    }, 5000);
}

async function fetchData() {
    try {
        orders = await fetchOrders();
        courses = await fetchCourses();
        tutors = await fetchTutors();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function renderOrders() {
    if (!orders || orders.length === 0) {
        ordersTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">No orders found.</td>
            </tr>
        `;
        return;
    }

    ordersTable.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedItems = orders.slice(start, end);

    pagedItems.forEach((order, index) => {
        const courseObj = order.course_id ? courses.find(c => c.id === order.course_id) : null;
        const tutorObj = order.tutor_id ? tutors.find(t => t.id === order.tutor_id) : null;

        const nameDisplay = courseObj
            ? courseObj.name
            : `Tutoring with ${tutorObj?.name || 'a tutor'}`;

        const dateDisplay = new Date(order.date_start).toLocaleDateString('en-US');
        const timeDisplay = order.time_start?.slice(0, 5) || '';
        const priceDisplay = new Intl.NumberFormat('en-US').format(order.price);

        const rowNumber = start + index + 1;
        const row = `
        <tr data-orderid="${order.id}">
            <td>${rowNumber}</td>
            <td><strong>${nameDisplay}</strong></td>
            <td>
                ${dateDisplay}
                ${timeDisplay ? `<span class="text-muted ms-1">(${timeDisplay})</span>` : ''}
            </td>
            <td>${priceDisplay} ₽</td>
            <td>
                <button class="btn btn-sm btn-outline-warning me-1 edit-order-btn" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-order-btn" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
        `;
        ordersTable.insertAdjacentHTML('beforeend', row);
    });
}

function renderPagination() {
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderOrders();
            renderPagination();
        });
        paginationContainer.appendChild(li);
    }
}

async function onLoad() {
    await fetchData();
    renderOrders();
    renderPagination();
}

async function refreshEnrollments() {
    currentPage = 1;
    await onLoad();
}

ordersTable?.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-order-btn');
    const editBtn = e.target.closest('.edit-order-btn');

    if (deleteBtn) {
        const orderId = deleteBtn.closest('tr').dataset.orderid;
        const order = orders.find(o => o.id == orderId);
        currentOrder = order;
        const modal = new bootstrap.Modal(document.getElementById('confirmRemovalModal'));
        modal.show();
        return;
    }

    if (editBtn) {
        // Редактирование недоступно на этой странице
        showAlert('To edit an order, please go to the main page.', 'info');
    }
});

document.getElementById('executeDeleteAction')?.addEventListener('click', async () => {
    if (!currentOrder) return;

    try {
        const url = `${BASE_URL}/orders/${currentOrder.id}?api_key=${API_KEY}`;
        await fetch(url, { method: 'DELETE' });

        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmRemovalModal'));
        modal?.hide();

        currentPage = 1;
        await onLoad();
    } catch (error) {
        showAlert('Failed to delete order.', 'danger');
    }
});

document.addEventListener('DOMContentLoaded', onLoad);