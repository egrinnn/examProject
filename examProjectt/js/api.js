const API_KEY = "e5992e19-c0fe-4ac0-9e07-8ccaa279890b";
const BASE_URL = "http://exam-api-courses.std-900.ist.mospolytech.ru/api";


async function fetchCourses() {
    const response = await fetch(`${BASE_URL}/courses?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
}

async function fetchTutors() {
    const response = await fetch(`${BASE_URL}/tutors?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch tutors');
    return await response.json();
}

async function fetchOrders() {
    const response = await fetch(`${BASE_URL}/orders?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
}
