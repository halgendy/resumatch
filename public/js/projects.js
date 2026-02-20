const API = "/api/projects";

const listEl = document.getElementById("projectsList");
const emptyEl = document.getElementById("emptyState");
const refreshBtn = document.getElementById("refreshBtn");

const form = document.getElementById("projectForm");
const idInput = document.getElementById("projectId");
const titleInput = document.getElementById("titleInput");
const datesInput = document.getElementById("datesInput");
const roleInput = document.getElementById("roleInput");
const techInput = document.getElementById("techInput");

const bulletsList = document.getElementById("bulletsList");
const addBulletBtn = document.getElementById("addBulletBtn");

const formTitle = document.getElementById("formTitle");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
const msgEl = document.getElementById("formMsg");

let projects = [];
let bullets = [];

/* =========================
   API
========================= */

async function fetchProjects() {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

async function createProject(data) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}

async function updateProject(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

async function deleteProject(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error("Delete failed");
  }
}

/* =========================
   UI Helpers
========================= */

function setMessage(text = "", error = false) {
  msgEl.textContent = text;
  msgEl.className = error ? "msg error" : "msg";
}

function resetForm() {
  idInput.value = "";
  titleInput.value = "";
  datesInput.value = "";
  roleInput.value = "";
  techInput.value = "";
  bullets = [];
  renderBullets();

  formTitle.textContent = "Add Project";
  cancelBtn.classList.add("hidden");
  deleteBtn.classList.add("hidden");
  setMessage("");
}

function fillForm(project) {
  idInput.value = project._id;
  titleInput.value = project.title || "";
  datesInput.value = project.dates || "";
  roleInput.value = project.role || "";
  techInput.value = (project.tech_stack || []).join(", ");

  bullets = project.bullets ? [...project.bullets] : [];
  renderBullets();

  formTitle.textContent = "Edit Project";
  cancelBtn.classList.remove("hidden");
  deleteBtn.classList.remove("hidden");
}

function render() {
  listEl.innerHTML = "";

  if (!projects.length) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  projects.forEach((p) => {
    const li = document.createElement("li");
    li.className = "list-item";

    const left = document.createElement("div");
    left.innerHTML = `
      <div class="item-title">${p.title}</div>
      <div class="item-meta">${p.dates || ""} • ${p.role || ""}</div>
    `;

    const right = document.createElement("div");
    right.className = "item-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => fillForm(p);

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
    input.oninput = (e) => {
      bullets[index].text = e.target.value;
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

/* =========================
   Events
========================= */

addBulletBtn.addEventListener("click", () => {
  bullets.push({ text: "" });
  renderBullets();
});

refreshBtn.addEventListener("click", load);

cancelBtn.addEventListener("click", resetForm);

deleteBtn.addEventListener("click", async () => {
  if (!idInput.value) return;
  if (!confirm("Delete this project?")) return;

  await deleteProject(idInput.value);
  await load();
  resetForm();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    setMessage("Title is required", true);
    return;
  }

  const data = {
    title,
    dates: datesInput.value.trim(),
    role: roleInput.value.trim(),
    tech_stack: techInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    bullets,
  };

  try {
    if (idInput.value) {
      await updateProject(idInput.value, data);
      setMessage("Updated successfully");
    } else {
      await createProject(data);
      setMessage("Created successfully");
    }

    await load();
    resetForm();
  } catch (err) {
    setMessage(err.message, true);
  }
});

/* =========================
   Init
========================= */

async function load() {
  projects = await fetchProjects();
  render();
}

load();