const API = "/api/experiences";

const listEl = document.getElementById("expList");
const emptyEl = document.getElementById("emptyState");
const refreshBtn = document.getElementById("refreshBtn");

const form = document.getElementById("expForm");
const idInput = document.getElementById("expId");
const companyInput = document.getElementById("companyInput");
const datesInput = document.getElementById("datesInput");
const roleInput = document.getElementById("roleInput");
const locationInput = document.getElementById("locationInput");

const bulletsList = document.getElementById("bulletsList");
const addBulletBtn = document.getElementById("addBulletBtn");

const formTitle = document.getElementById("formTitle");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
const msgEl = document.getElementById("formMsg");

let experiences = [];
let bullets = [];

/* API */
async function fetchExperiences() {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch experiences");
  return res.json();
}

async function createExperience(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}

async function updateExperience(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

async function deleteExperience(id) {
  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Delete failed");
}

/* UI */
function setMessage(text = "", error = false) {
  msgEl.textContent = text;
  msgEl.className = error ? "msg error" : "msg";
}

function render() {
  listEl.innerHTML = "";

  if (!experiences.length) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  experiences.forEach((e) => {
    const li = document.createElement("li");
    li.className = "list-item";

    const left = document.createElement("div");
    left.innerHTML = `
      <div class="item-title">${e.company}</div>
      <div class="item-meta">${e.dates || ""} • ${e.role || ""} • ${e.location || ""}</div>
    `;

    const right = document.createElement("div");
    right.className = "item-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => fillForm(e);

    right.appendChild(editBtn);

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);
  });
}

function renderBullets() {
  bulletsList.innerHTML = "";

  bullets.forEach((b, index) => {
    const li = document.createElement("li");
    li.className = "bullet-row";

    const input = document.createElement("input");
    input.type = "text";
    input.value = b.text;
    input.oninput = (ev) => {
      bullets[index].text = ev.target.value;
    };

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.onclick = () => {
      bullets.splice(index, 1);
      renderBullets();
    };

    li.appendChild(input);
    li.appendChild(removeBtn);
    bulletsList.appendChild(li);
  });
}

function resetForm() {
  idInput.value = "";
  companyInput.value = "";
  datesInput.value = "";
  roleInput.value = "";
  locationInput.value = "";
  bullets = [];
  renderBullets();

  formTitle.textContent = "Add Experience";
  cancelBtn.classList.add("hidden");
  deleteBtn.classList.add("hidden");
  setMessage("");
}

function fillForm(exp) {
  idInput.value = exp._id;
  companyInput.value = exp.company || "";
  datesInput.value = exp.dates || "";
  roleInput.value = exp.role || "";
  locationInput.value = exp.location || "";

  bullets = exp.bullets ? [...exp.bullets] : [];
  renderBullets();

  formTitle.textContent = "Edit Experience";
  cancelBtn.classList.remove("hidden");
  deleteBtn.classList.remove("hidden");
}

/* Events */
addBulletBtn.addEventListener("click", () => {
  bullets.push({ text: "" });
  renderBullets();
});

refreshBtn.addEventListener("click", load);
cancelBtn.addEventListener("click", resetForm);

deleteBtn.addEventListener("click", async () => {
  if (!idInput.value) return;
  if (!confirm("Delete this experience?")) return;

  await deleteExperience(idInput.value);
  await load();
  resetForm();
});

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const company = companyInput.value.trim();
  if (!company) {
    setMessage("Company is required", true);
    return;
  }

  const data = {
    company,
    dates: datesInput.value.trim(),
    role: roleInput.value.trim(),
    location: locationInput.value.trim(),
    bullets,
  };

  try {
    if (idInput.value) {
      await updateExperience(idInput.value, data);
      setMessage("Updated successfully");
    } else {
      await createExperience(data);
      setMessage("Created successfully");
    }

    await load();
    resetForm();
  } catch (err) {
    setMessage(err.message, true);
  }
});

/* Init */
async function load() {
  experiences = await fetchExperiences();
  render();
}
load();
