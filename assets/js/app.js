const $ = (id) => document.getElementById(id);
const state = {
  lang: localStorage.getItem("pw_lang") || "en",
  query: "",
  category: "All",
  data: [],
  translations: {},
  meta: { languages: [{ code: "en", name: "English" }] },
};

async function loadJSON(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error("Failed to load " + url);
  return r.json();
}

function displayOf(p) {
  const tr = (state.translations[state.lang] && state.translations[state.lang][p.id]) || {};
  return {
    title: tr.title || p.title,
    category: tr.category || p.category,
    description: tr.description || "",
  };
}

function categoryLabels() {
  // 英文 category -> 当前语言显示名
  const map = {};
  for (const p of state.data) {
    if (!(p.category in map)) {
      const tr = (state.translations[state.lang] && state.translations[state.lang][p.id]) || {};
      map[p.category] = tr.category || p.category;
    }
  }
  return map;
}

function initLangSelect() {
  const sel = $("langSelect");
  sel.innerHTML = "";
  for (const l of state.meta.languages) {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.name;
    if (l.code === state.lang) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.onchange = () => {
    state.lang = sel.value;
    localStorage.setItem("pw_lang", state.lang);
    renderCategories();
    renderGrid();
  };
}

function renderCategories() {
  const bar = $("categoryBar");
  const labels = categoryLabels();
  const cats = ["All", ...Object.keys(labels)];
  bar.innerHTML = "";
  for (const c of cats) {
    const chip = document.createElement("button");
    chip.className = "chip" + (c === state.category ? " active" : "");
    chip.textContent = c === "All" ? (state.lang === "zh" ? "全部" : "All") : labels[c];
    chip.onclick = () => {
      state.category = c;
      renderCategories();
      renderGrid();
    };
    bar.appendChild(chip);
  }
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  return state.data.filter((p) => {
    if (state.category !== "All" && p.category !== state.category) return false;
    if (!q) return true;
    const d = displayOf(p);
    const hay = [d.title, d.category, d.description, p.prompt, p.model].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

function renderGrid() {
  const grid = $("grid");
  const list = filtered();
  $("emptyState").hidden = list.length > 0;
  grid.innerHTML = "";
  for (const p of list) {
    const d = displayOf(p);
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-img"><img src="${p.image}" alt="${escapeHtml(d.title)}" loading="lazy"></div>
      <div class="card-body">
        <span class="card-cat">${escapeHtml(d.category)}</span>
        <h3 class="card-title">${escapeHtml(d.title)}</h3>
      </div>`;
    card.onclick = () => openModal(p);
    grid.appendChild(card);
  }
}

function openModal(p) {
  const d = displayOf(p);
  $("modalImg").src = p.image;
  $("modalImg").alt = d.title;
  $("modalCat").textContent = d.category;
  $("modalTitle").textContent = d.title;
  $("modalDesc").textContent = d.description;
  $("modalPrompt").textContent = p.prompt;
  const meta = $("modalMeta");
  meta.innerHTML = "";
  const rows = [["Model", p.model], ["Category", d.category], ["Ratio", p.ratio]];
  for (const [k, v] of rows) {
    if (!v) continue;
    const li = document.createElement("li");
    li.innerHTML = `<span class="det-label">${k}</span><span>${escapeHtml(v)}</span>`;
    meta.appendChild(li);
  }
  const src = $("modalSource");
  if (p.authorUrl) {
    src.href = p.authorUrl;
    src.hidden = false;
  } else {
    src.hidden = true;
  }
  $("modal").hidden = false;
  document.body.style.overflow = "hidden";
  $("copyBtn").classList.remove("copied");
  $("copyBtn").textContent = state.lang === "zh" ? "复制" : "Copy";
}

function closeModal() {
  $("modal").hidden = true;
  document.body.style.overflow = "";
}

function copyPrompt() {
  const text = $("modalPrompt").textContent;
  const done = () => {
    const btn = $("copyBtn");
    btn.classList.add("copied");
    btn.textContent = state.lang === "zh" ? "已复制" : "Copied";
    showToast(state.lang === "zh" ? "提示词已复制" : "Prompt copied");
    setTimeout(() => { btn.classList.remove("copied"); btn.textContent = state.lang === "zh" ? "复制" : "Copy"; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { showToast("Copy failed"); }
  document.body.removeChild(ta);
}

let toastTimer;
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function init() {
  try {
    const [meta, data, translations] = await Promise.all([
      loadJSON("./data/_meta.json"),
      loadJSON("./data/prompts.json"),
      loadJSON("./data/translations.json"),
    ]);
    state.meta = meta;
    state.data = data;
    state.translations = translations;
  } catch (e) {
    console.error(e);
    $("grid").innerHTML = '<p class="empty">Failed to load prompt data.</p>';
    return;
  }
  initLangSelect();
  renderCategories();
  renderGrid();

  $("searchInput").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderGrid();
  });
  $("copyBtn").addEventListener("click", copyPrompt);
  document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

init();
