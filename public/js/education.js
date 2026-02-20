const API = '/api/education';

const listEl = document.getElementById('eduList');
const emptyEl = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');

const form = document.getElementById('eduForm');
const idInput = document.getElementById('eduId');
const schoolInput = document.getElementById('schoolInput');
const locationInput = document.getElementById('locationInput');
const datesInput = document.getElementById('datesInput');
const degreeInput = document.getElementById('degreeInput');
const gpaInput = document.getElementById('gpaInput');
const activitiesInput = document.getElementById('activitiesInput');
const courseworkInput = document.getElementById('courseworkInput');

const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');
const deleteBtn = document.getElementById('deleteBtn');
const msgEl = document.getElementById('formMsg');

let education = [];

/* API */
async function fetchEducation() {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Failed to fetch education');
    return res.json();
}

async function createEducation(data) {
    const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Create failed');
    return res.json();
}

async function updateEducation(id, data) {
    const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
}

async function deleteEducation(id) {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Delete failed');
}

/* UI */
function setMessage(text = '', error = false) {
    msgEl.textContent = text;
    msgEl.className = error ? 'msg error' : 'msg';
}

function toArrayFromCommaString(s) {
    return s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}

function toCommaString(arr) {
    return Array.isArray(arr) ? arr.join(', ') : '';
}

function render() {
    listEl.innerHTML = '';

    if (!education.length) {
        emptyEl.classList.remove('hidden');
        return;
    }
    emptyEl.classList.add('hidden');

    education.forEach((e) => {
        const li = document.createElement('li');
        li.className = 'list-item';

        const left = document.createElement('div');
        const line1 = `${e.school}${e.degree ? ' • ' + e.degree : ''}`;
        const line2 = `${e.dates || ''}${e.location ? ' • ' + e.location : ''}${e.gpa ? ' • GPA: ' + e.gpa : ''}`;

        left.innerHTML = `
      <div class="item-title">${line1}</div>
      <div class="item-meta">${line2}</div>
    `;

        const right = document.createElement('div');
        right.className = 'item-actions';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => fillForm(e);

        right.appendChild(editBtn);

        li.appendChild(left);
        li.appendChild(right);
        listEl.appendChild(li);
    });
}

function resetForm() {
    idInput.value = '';
    schoolInput.value = '';
    locationInput.value = '';
    datesInput.value = '';
    degreeInput.value = '';
    gpaInput.value = '';
    activitiesInput.value = '';
    courseworkInput.value = '';

    formTitle.textContent = 'Add Education';
    cancelBtn.classList.add('hidden');
    deleteBtn.classList.add('hidden');
    setMessage('');
}

function fillForm(e) {
    idInput.value = e._id;
    schoolInput.value = e.school || '';
    locationInput.value = e.location || '';
    datesInput.value = e.dates || '';
    degreeInput.value = e.degree || '';
    gpaInput.value = e.gpa || '';
    activitiesInput.value = toCommaString(e.activities);
    courseworkInput.value = toCommaString(e.coursework);

    formTitle.textContent = 'Edit Education';
    cancelBtn.classList.remove('hidden');
    deleteBtn.classList.remove('hidden');
    setMessage('');
}

/* Events */
refreshBtn.addEventListener('click', load);
cancelBtn.addEventListener('click', resetForm);

deleteBtn.addEventListener('click', async () => {
    if (!idInput.value) return;
    if (!confirm('Delete this education record?')) return;

    await deleteEducation(idInput.value);
    await load();
    resetForm();
});

form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const school = schoolInput.value.trim();
    if (!school) {
        setMessage('School is required', true);
        return;
    }

    const data = {
        school,
        location: locationInput.value.trim(),
        dates: datesInput.value.trim(),
        degree: degreeInput.value.trim(),
        gpa: gpaInput.value.trim(),
        activities: toArrayFromCommaString(activitiesInput.value),
        coursework: toArrayFromCommaString(courseworkInput.value),
    };

    try {
        if (idInput.value) {
            await updateEducation(idInput.value, data);
            setMessage('Updated');
        } else {
            await createEducation(data);
            setMessage('Created');
        }

        await load();
        resetForm();
    } catch (err) {
        setMessage(err.message, true);
    }
});

/* Init */
async function load() {
    education = await fetchEducation();
    render();
}
load();
