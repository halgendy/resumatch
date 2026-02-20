const API_BASE = "/api/skills";

const els = {
  list: document.getElementById("skillsList"),
  empty: document.getElementById("emptyState"),
  refreshBtn: document.getElementById("refreshBtn"),

  form: document.getElementById("skillForm"),
  formTitle: document.getElementById("formTitle"),
  msg: document.getElementById("formMsg"),

  id: document.getElementById("skillId"),
  name: document.getElementById("nameInput"),
  category: document.getElementById("categoryInput"),

  cancelBtn: document.getElementById("cancelBtn"),
};

let skills = [];

function setMessage(text = "", isError = false) {
  els.msg.textContent = text;
  els.msg.className = isError ? "msg error" : "msg";
}

function resetForm() {
  els.id.value = "";
  els.name.value = "";
  els.category.value = "";
  els.formTitle.textContent = "Add Skill";
  els.cancelBtn.classList.add("hidden");
  setMessage("");
}

function fillForm(skill) {
  els.id.value = skill._id;
  els.name.value = skill.name ?? "";
  els.category.value = skill.category ?? "";
  els.formTitle.textContent = "Edit Skill";
  els.cancelBtn.classList.remove("hidden");
  setMessage("");
}

function renderList() {
  els.list.innerHTML = "";

  if (!skills.length) {
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");

  for (const s of skills) {
    const li = document.createElement("li");
    li.className = "list-item";

    const left = document.createElement("div");
    left.className = "item-left";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = s.name;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = s.category
      ? `Category: ${s.category}`
      : "Category: (none)";

    left.appendChild(title);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "item-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => fillForm(s));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => onDelete(s._id));

    right.appendChild(editBtn);
    right.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(right);
    els.list.appendChild(li);
  }
}

async function fetchSkills() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to load skills");
  return res.json();
}

async function createSkill(payload) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create skill");
  }
  return res.json();
}

async function updateSkill(id, payload) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update skill");
  }
  return res.json();
}

async function deleteSkill(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete skill");
  }
}

async function reload() {
  setMessage("");
  skills = await fetchSkills();
  renderList();
}

async function onDelete(id) {
  const ok = window.confirm("Delete this skill?");
  if (!ok) return;

  try {
    await deleteSkill(id);
    await reload();

    if (els.id.value === id) resetForm();
  } catch (err) {
    setMessage(err.message, true);
  }
}

els.refreshBtn.addEventListener("click", () => reload());

els.cancelBtn.addEventListener("click", () => resetForm());

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = els.name.value.trim();
  const category = els.category.value.trim();

  if (!name) {
    setMessage("Name is required.", true);
    return;
  }

  const payload = { name, category };

  try {
    if (els.id.value) {
      await updateSkill(els.id.value, payload);
      setMessage("Updated");
    } else {
      await createSkill(payload);
      setMessage("Created");
    }
    await reload();
    resetForm();
  } catch (err) {
    setMessage(err.message, true);
  }
});

// initial
reload().catch((err) => setMessage(err.message, true));