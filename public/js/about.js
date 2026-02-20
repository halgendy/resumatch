const API = '/api/about';

const els = {
    form: document.getElementById('aboutForm'),
    reloadBtn: document.getElementById('reloadBtn'),
    msg: document.getElementById('msg'),

    name: document.getElementById('nameInput'),
    phone: document.getElementById('phoneInput'),
    email: document.getElementById('emailInput'),
    location: document.getElementById('locationInput'),
    availability: document.getElementById('availabilityInput'),

    webDisplay: document.getElementById('webDisplay'),
    webUrl: document.getElementById('webUrl'),
    liDisplay: document.getElementById('liDisplay'),
    liUrl: document.getElementById('liUrl'),
    ghDisplay: document.getElementById('ghDisplay'),
    ghUrl: document.getElementById('ghUrl'),
};

function setMsg(text = '', isError = false) {
    els.msg.textContent = text;
    els.msg.className = isError ? 'msg error' : 'msg';
}

function fillForm(data) {
    els.name.value = data?.name ?? '';
    els.phone.value = data?.phone ?? '';
    els.email.value = data?.email ?? '';
    els.location.value = data?.location ?? '';
    els.availability.value = data?.availability ?? '';

    els.webDisplay.value = data?.links?.website?.display ?? '';
    els.webUrl.value = data?.links?.website?.url ?? '';
    els.liDisplay.value = data?.links?.linkedin?.display ?? '';
    els.liUrl.value = data?.links?.linkedin?.url ?? '';
    els.ghDisplay.value = data?.links?.github?.display ?? '';
    els.ghUrl.value = data?.links?.github?.url ?? '';
}

async function load() {
    setMsg('');
    const res = await fetch(API);
    if (!res.ok) {
        setMsg('Failed to load about', true);
        return;
    }
    const data = await res.json();
    fillForm(data);
}

async function save(payload) {
    const res = await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save');
    return res.json();
}

els.reloadBtn.addEventListener('click', load);

els.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        name: els.name.value.trim(),
        phone: els.phone.value.trim(),
        email: els.email.value.trim(),
        location: els.location.value.trim(),
        availability: els.availability.value.trim(),
        links: {
            website: {
                display: els.webDisplay.value.trim(),
                url: els.webUrl.value.trim(),
            },
            linkedin: {
                display: els.liDisplay.value.trim(),
                url: els.liUrl.value.trim(),
            },
            github: {
                display: els.ghDisplay.value.trim(),
                url: els.ghUrl.value.trim(),
            },
        },
    };

    try {
        await save(payload);
        setMsg('Saved');
    } catch (err) {
        setMsg(err.message, true);
    }
});

// init
load();
