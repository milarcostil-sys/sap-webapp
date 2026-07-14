"use strict";



/* =========================
   MOBILE STATE
========================= */

const Mobile = {
    view: "home",
    currentQueryId: null
};

/* =========================
   DASHBOARD
========================= */
function renderDashboard() {

    const content = document.getElementById("content");
    if (!content) return;

    const search =
        (document.getElementById("searchBox")?.value || "")
            .toLowerCase();

    // =========================
    // MODULE FILTER PRIORITY FIX
    // =========================
    const selectModule =
        document.getElementById("moduleFilter")?.value || "";

    const module =
        selectModule ||
        App.initialModule ||   // 👈 מה-MAIN חד פעמי
        "";

    let list = [...App.queries];

    // =========================
    // MODULE FILTER
    // =========================
    if (module) {
        list = list.filter(q => q.module === module);
    }

    // =========================
    // FAVORITES
    // =========================
    if (App.showFavorites) {
        list = list.filter(q => App.favorites.has(q.id));
    }

    // =========================
    // SEARCH
    // =========================
    if (search) {
        list = list.filter(q =>
            (q.name || "").toLowerCase().includes(search) ||
            (q.description || "").toLowerCase().includes(search) ||
            (q.id || "").toLowerCase().includes(search)
        );
    }

    // =========================
    // VIEW STATE
    // =========================
    Mobile.view = "home";

    // =========================
    // EMPTY STATE
    // =========================
    if (!list.length) {

        content.innerHTML = `
            <div class="card">
                <div class="card-title">No results found</div>
                <div class="card-desc">Try adjusting your filters</div>
            </div>
        `;

        App.initialModule = ""; // חשוב לניקוי
        return;
    }

    // =========================
    // RENDER
    // =========================
    content.innerHTML = `
        <div class="mobile-grid">
            ${list.map(renderCard).join("")}
        </div>
    `;

    // =========================
    // CLEAR MAIN FILTER (ONE TIME ONLY)
    // =========================
    App.initialModule = "";
}
/* =========================
   CARD
========================= */
function renderCard(q) {

    const color = moduleColor(q.module);

    return `
        <div class="mobile-card" style="--c:${color}">

            <div class="mobile-card-top">

                <div class="mobile-icon"
                     style="background:${color}22; color:${color};">
                    ${q.icon || "🔹"}
                </div>

                <div class="mobile-fav"
                     onclick="event.stopPropagation();toggleFavorite('${q.id}')">
                    ${App.favorites.has(q.id) ? "⭐" : "☆"}
                </div>

            </div>

            <div class="mobile-title">${q.name || ""}</div>
            <div class="mobile-desc">${q.description || ""}</div>

            <div class="mobile-card-actions">

                <button class="mobile-open-mini"
                        style="--c:${color}"
                        onclick="openQueryMobile('${q.id}')">
                    ▶
                </button>

            </div>

        </div>
    `;
}
/* =========================
   OPEN QUERY
========================= */

/* =========================
   OPEN QUERY
========================= */

async function openQueryMobile(id) {

    App.lastResult = null;
    App.currentQuery = null;

    const token = localStorage.getItem("token");

    const res = await fetch(API_BASE + "/query/" + id, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (!res.ok) {
        alert("Failed loading query");
        return;
    }

    const query = await res.json();

    App.currentQuery = query;
    Mobile.view = "query";
    Mobile.currentQueryId = id;

    // =========================
    // תמיד מציג את מסך השאילתה
    // =========================
    renderQueryMobile(query);

    // =========================
    // אם אין פרמטרים - מריץ מיד
    // =========================
    if ((query.parameters || []).length === 0) {

        runQueryMobile(id);

    }

    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: "instant"
        });
    }, 0);
}
/* =========================
   QUERY SCREEN
========================= */
/* =========================
   QUERY SCREEN
========================= */

function renderQueryMobile(query) {

    const content = document.getElementById("content");

    const hasParams = (query.parameters || []).length > 0;

    let inputs = "";

    (query.parameters || []).forEach(p => {

        inputs += `
            <div class="mobile-field query-param">

                <div class="mobile-field-label">
                    ${p.label}
                </div>

                ${renderInput(p)}

            </div>
        `;
    });

    content.innerHTML = `

        <div class="mobile-query-card">

            <div class="mobile-query-header">

                <div class="mobile-query-icon">
                    ${query.icon || "🔍"}
                </div>

                <div>

                    <div class="mobile-query-title">
                        ${query.name}
                    </div>

                    <div class="mobile-query-desc">
                        ${query.description || ""}
                    </div>

                </div>

            </div>

            <div class="mobile-form">
                ${inputs}
            </div>

            ${hasParams ? `
                <button class="mobile-run"
                        onclick="runQueryMobile('${query.id}')">
                    ▶ Run Query
                </button>
            ` : ""}

            <div class="mobile-export">

                <button onclick="exportExcel()">
                    📊 Excel
                </button>

                <button onclick="exportPDF()">
                    📄 PDF
                </button>

            </div>

        </div>

        <div id="results">

            ${(hasParams) ? "" : `
                <div class="mobile-query-card">
                    Running query...
                </div>
            `}

        </div>
    `;
}
/* =========================
   RUN QUERY
========================= */

async function runQueryMobile(id) {

    const token = localStorage.getItem("token");

    const inputs = document.querySelectorAll(".query-param input, .query-param select, .query-param textarea");

    const body = {};

    inputs.forEach(i => {
        if (i.id) body[i.id] = i.value;
    });

    const res = await fetch(API_BASE + "/query/" + id + "/run", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
    });

    App.lastResult = await res.json();

    renderResultsMobile(App.lastResult);
}

/* =========================
   RESULTS
========================= */
function renderResultsMobile(data) {

    const el = document.getElementById("results");

    if (!data?.rows?.length) {
        el.innerHTML = `
            <div class="mobile-query-card">
                <div class="card-title">אין נתונים להצגה</div>
                <div class="card-desc">נסה להריץ שאילתה או לשנות פילטר</div>
            </div>
        `;
        return;
    }

    const rows = data.rows || [];

    const filtered = rows.filter(row => {
        if (!App.resultFilter) return true;

        const s = App.resultFilter.toLowerCase();

        return Object.values(row).some(v =>
            String(v ?? "").toLowerCase().includes(s)
        );
    });

    let html = `
        <div class="mobile-results-toolbar">
            <div class="mobile-results-count">
                ${filtered.length} / ${rows.length}
            </div>

            <input
    id="resultFilter"
    class="mobile-results-filter"
    placeholder="🔍 סינון תוצאות..."
    value="${App.resultFilter || ""}"
    oninput="filterResults(this.value)"
>
        </div>

        <div class="mobile-grid">
    `;

    filtered.forEach((row, index) => {

        const entries = Object.entries(row);

        const preview = entries.slice(0, 5);
        const details = entries.slice(5);

        html += `
            <div class="mobile-result-card">
        `;

        // ======================
        // PREVIEW (5 ראשונים)
        // ======================
        preview.forEach(([key, value]) => {

            const lower = key.toLowerCase();
            const isItem = lower.includes("itemcode");

            html += `
                <div class="mobile-field">
                    <div class="mobile-field-label">${key}</div>

                    ${
                        isItem
                        ? `
                            <div class="mobile-field-value mobile-drill"
                                 onclick="openItemDrill('${value}')">
                                🔎 ${value}
                            </div>
                        `
                        : `
                            <div class="mobile-field-value">
                                ${value ?? ""}
                            </div>
                        `
                    }
                </div>
            `;
        });

        // ======================
        // BUTTON
        // ======================
        if (details.length) {

            html += `
                <button class="mobile-expand"
                        onclick="toggleResultCard(${index})">
                    ▼ פרטים נוספים
                </button>

                <div id="result-details-${index}"
                     class="mobile-result-details"
                     style="display:none;">
            `;

            // ======================
            // DETAILS
            // ======================
            details.forEach(([key, value]) => {

                html += `
                    <div class="mobile-field">
                        <div class="mobile-field-label">${key}</div>
                        <div class="mobile-field-value">${value ?? ""}</div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `</div>`;
    });

    html += `</div>`;

    el.innerHTML = html;
}
/* =========================
   BACK
========================= */

function backToDashboard() {

    Mobile.view = "home";
    Mobile.currentQueryId = null;

    App.lastResult = null;
    App.currentQuery = null;

    const content = document.getElementById("content");
    const results = document.getElementById("results");

    if (results) results.innerHTML = "";

    renderDashboard();
}

/* =========================
   QuickSearch

========================= */
/* =========================
   QUICK SEARCH STATE
========================= */
let quickSearchState = {
    list: [],
    index: 0,
    visible: false
};

/* =========================
   OPEN QUICK SEARCH
========================= */
function openQuickSearch() {

    let el = document.getElementById("quickSearchOverlay");

    if (!el) {

        el = document.createElement("div");
        el.id = "quickSearchOverlay";
        el.className = "quick-search-overlay";

        el.innerHTML = `
            <div class="quick-search-box">

                <input id="quickSearchInput"
                       placeholder="Search queries..."
                       autocomplete="off" />

                <div id="quickSearchResults"></div>

            </div>
        `;

        document.body.appendChild(el);

        /* close on outside click */
        el.addEventListener("click", (e) => {
            if (e.target.id === "quickSearchOverlay") {
                closeQuickSearch();
            }
        });

        const input = document.getElementById("quickSearchInput");

        /* typing */
        input.addEventListener("input", (e) => {
            renderQuickSearch(e.target.value);
        });

        /* keyboard */
        input.addEventListener("keydown", (e) => {

            switch (e.key) {

                case "Escape":
                    closeQuickSearch();
                    break;

                case "ArrowDown":
                    e.preventDefault();
                    moveSelection(1);
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    moveSelection(-1);
                    break;

                case "Enter":
                    e.preventDefault();
                    selectCurrent();
                    break;
            }
        });
    }

    quickSearchState.visible = true;

    /* 🔥 חשוב: נעילת UI */
    document.body.classList.add("quick-search-open");

    el.style.display = "flex";

    setTimeout(() => {
        document.getElementById("quickSearchInput")?.focus();
    }, 50);

    renderQuickSearch("");
}
function closeQuickSearch() {

    const el = document.getElementById("quickSearchOverlay");

    if (el) {
        el.style.display = "none";
    }

    quickSearchState.visible = false;

    /* 🔥 ביטול נעילה */
    document.body.classList.remove("quick-search-open");
}
/* =========================
   RENDER RESULTS
========================= */
function renderQuickSearch(value) {

    const q = (value || "").toLowerCase();

    quickSearchState.list = (App.queries || []).filter(x =>
        (x.name || "").toLowerCase().includes(q) ||
        (x.description || "").toLowerCase().includes(q) ||
        (x.id || "").toLowerCase().includes(q)
    );

    quickSearchState.index = 0;

    const el = document.getElementById("quickSearchResults");
    if (!el) return;

    if (!quickSearchState.list.length) {
        el.innerHTML = `
            <div class="quick-empty">No results</div>
        `;
        return;
    }

    el.innerHTML = quickSearchState.list.map((item, i) => `
        <div class="quick-item ${i === quickSearchState.index ? "active" : ""}"
             data-id="${item.id}"
             onclick="selectQuickItemById('${item.id}')">

            <div class="quick-title">${item.name || ""}</div>
            <div class="quick-desc">${item.description || ""}</div>

        </div>
    `).join("");
}

/* =========================
   CLICK ITEM (SAFE)
========================= */
function selectQuickItemById(id) {

    const item = quickSearchState.list.find(x => x.id === id);
    if (!item) return;

    closeQuickSearch();

    // 🔥 קריטי: תמיד דרך window
    if (typeof window.openQuery === "function") {
        window.openQuery(id);
    } else {
        console.error("openQuery is not defined");
    }
}

/* =========================
   KEY NAV
========================= */
function moveSelection(dir) {

    if (!quickSearchState.list.length) return;

    quickSearchState.index += dir;

    if (quickSearchState.index < 0)
        quickSearchState.index = 0;

    if (quickSearchState.index >= quickSearchState.list.length)
        quickSearchState.index = quickSearchState.list.length - 1;

    updateActive();
}

/* =========================
   UPDATE ACTIVE UI
========================= */
function updateActive() {

    const items = document.querySelectorAll(".quick-item");

    items.forEach((el, i) => {
        el.classList.toggle("active", i === quickSearchState.index);
    });
}

/* =========================
   ENTER / SELECT CURRENT
========================= */
function selectCurrent() {

    const item = quickSearchState.list[quickSearchState.index];

    if (!item) return;

    closeQuickSearch();

    if (typeof window.openQuery === "function") {
        window.openQuery(item.id);
    } else {
        console.error("openQuery is not defined");
    }
}

/* =========================
   CLOSE
========================= */
function closeQuickSearch() {

    const el = document.getElementById("quickSearchOverlay");

    if (el) {
        el.style.display = "none";
    }

    quickSearchState.visible = false;
}
function updateActive() {

    const items = document.querySelectorAll(".quick-item");

    items.forEach((el, i) => {
        const active = i === quickSearchState.index;
        el.classList.toggle("active", active);

        if (active) {
            el.scrollIntoView({
                block: "nearest",
                behavior: "smooth"
            });
        }
    });
}
function moduleColor(module) {

    if (!module)
        return "#64748b";

    module = module.toLowerCase().trim();

    if (moduleColorMap[module])
        return moduleColorMap[module];

    const index =
        Object.keys(moduleColorMap).length %
        colorPalette.length;

    moduleColorMap[module] = colorPalette[index];

    localStorage.setItem(
        "moduleColorMap",
        JSON.stringify(moduleColorMap)
    );

    return moduleColorMap[module];
}

function toggleResultCard(index) {

    const el =
        document.getElementById(
            "result-details-" + index
        );

    if (!el)
        return;

    if (el.style.display === "none") {

        el.style.display = "block";

    } else {

        el.style.display = "none";
    }
}

window.toggleResultCard =
    toggleResultCard;

/* =========================
   EXPORTS
========================= */

window.renderDashboard = renderDashboard;
window.openQueryMobile = openQueryMobile;
window.renderQueryMobile = renderQueryMobile;
window.runQueryMobile = runQueryMobile;
window.renderResultsMobile = renderResultsMobile;
window.backToDashboard = backToDashboard;
window.applyTheme = applyTheme;
window.openQuery = openQueryMobile;
