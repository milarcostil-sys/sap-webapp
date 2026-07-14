"use strict";


/* =========================
   DASHBOARD ENGINE V4
========================= */
function renderDashboard() {

    const content = document.getElementById("content");
    if (!content) return;

    const search =
        (document.getElementById("searchBox")?.value || "")
            .toLowerCase();

    // =========================
    // MODULE FILTER (FIXED PRIORITY)
    // =========================
    const selectModule =
        document.getElementById("moduleFilter")?.value || "";

    const module =
        selectModule ||
        App.initialModule ||   // 👈 מה-MAIN (חד פעמי)
        "";

    let list = [...(App.queries || [])];

    // =========================
    // APPLY MODULE FILTER
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
    // SEARCH FILTER
    // =========================
    if (search) {
        list = list.filter(q =>
            (q.name || "").toLowerCase().includes(search) ||
            (q.id || "").toLowerCase().includes(search) ||
            (q.description || "").toLowerCase().includes(search)
        );
    }

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
        App.initialModule = ""; // חשוב לנקות גם פה
        return;
    }

    // =========================
    // RENDER GRID
    // =========================
    content.innerHTML = `
        <div class="grid">
            ${list.map(renderCard).join("")}
        </div>
    `;

    // =========================
    // CLEAR MAIN FILTER (ONE TIME ONLY)
    // =========================
    App.initialModule = "";
}
/* =========================
   CARD (V4 DESIGN)
========================= */

function renderCard(q) {

    const color = moduleColor(q.module);

    return `
        <div class="card" style="--accent:${color}">

            <div class="fav" onclick="toggleFavorite('${q.id}')">
                ${App.favorites.has(q.id) ? "⭐" : "☆"}
            </div>

            <div class="card-top">

                <div class="card-icon">
                    ${q.icon || "📦"}
                </div>

                <div class="card-meta">
                    <div class="card-title">
                        ${escapeHtml(q.name || "")}
                    </div>

                    <div class="card-module">
                        ${q.module || "general"}
                    </div>
                </div>

                <button class="card-open-btn"
                        onclick="openQuery('${q.id}')">
                    ▶
                </button>

            </div>

            <div class="card-desc">
                ${escapeHtml(q.description || "")}
            </div>

        </div>
    `;
}
/* =========================
   QUERY VIEW V4
========================= */

function renderQuery(query) {

    const content =
        document.getElementById("content");

    const area =
        document.getElementById("query-area");


    if (content) {
        content.style.display = "none";
    }


    area.innerHTML = `

        <div class="query-layout">

            <div class="query-card">


                <div class="query-header-grid">


                    <!-- ROW 1 -->
                    <div class="query-title">

                        ${escapeHtml(query.name || "")}

                    </div>


                    <div class="header-back">

                        <button class="back-btn"
                            onclick="backToDashboard()">

                            ← Back

                        </button>

                    </div>



                    <!-- ROW 2 -->
                    <div class="query-subtitle">

                        ${escapeHtml(query.description || "")}

                    </div>


                    <div class="header-export">


                        <button class="excel-btn"
                            onclick="exportExcel()">

                            📊 Excel

                        </button>


                        <button class="pdf-btn"
                            onclick="exportPDF()">

                            📄 PDF

                        </button>


                    </div>


                </div>


            </div>



        </div>


        <div class="results-wrapper">


            <div id="results">

                <div class="card">

                    Running query...

                </div>

            </div>


        </div>

    `;

}
function renderTable(data) {

    const el = document.getElementById("results");
    if (!el) return;


    if (!data?.rows?.length) {

        el.innerHTML = `
            <div class="card">
                <div class="card-title">
                    אין נתונים להצגה
                </div>
            </div>
        `;

        return;
    }


    const columns = data.columns || [];
    const rows = data.rows || [];


    // =========================
    // FILTER RESULTS
    // =========================

    const filtered = rows.filter(row => {

        if (!App.resultFilter) return true;

        const s =
            App.resultFilter.toLowerCase();

        return Object.values(row).some(v =>
            String(v ?? "")
                .toLowerCase()
                .includes(s)
        );

    });



    let html = `

        <div class="results-toolbar">


            <div class="results-info">

                ${filtered.length}
                /
                ${rows.length}
                results

            </div>



            <input

                id="resultFilter"

                class="result-search"

                type="text"

                placeholder="Search results..."

                value="${escapeHtml(App.resultFilter)}"

                oninput="filterResults(this.value)"

            >


        </div>


        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>

    `;



    // =========================
    // HEADER
    // =========================

    columns.forEach((c) => {


        let arrow = " ⇅";


        if (App.sortField === c.field) {

            arrow =
                App.sortDirection === "asc"
                    ? " ▲"
                    : " ▼";

        }


        html += `

            <th onclick="sortTable('${c.field}')">

                ${escapeHtml(c.title)}
                ${arrow}

            </th>

        `;

    });



    html += `

                    </tr>

                </thead>


                <tbody>

    `;



    // =========================
    // ROWS
    // =========================

    filtered.forEach(r => {


        html += `<tr>`;


        columns.forEach((c) => {


            let value =
                formatValue(
                    r[c.field],
                    c.format
                );


            const field =
                (c.field || "")
                .toLowerCase();



            if (field.includes("itemcode")) {


                html += `

                    <td class="clickable-cell"

                        onclick="openItemDrill('${r[c.field]}')">

                        <span class="cell-link">

                            ${value ?? ""}

                        </span>

                    </td>

                `;


            } else {


                html += `

                    <td>

                        ${value ?? ""}

                    </td>

                `;

            }


        });


        html += `</tr>`;

    });



    html += `

                </tbody>

            </table>

        </div>

    `;



    el.innerHTML = html;

}
/* =========================
   BACK
========================= */

function backToDashboard() {

    App.currentQuery = null;
    App.lastResult = null;
    App.resultFilter = "";

    const content = document.getElementById("content");
    const area = document.getElementById("query-area");

    if (content) content.style.display = "block";
    if (area) area.innerHTML = "";

    renderDashboard();
}

/* =========================
   SAFE HTML
========================= */

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

/* =========================
SERCH PRO
========================= */
let cmdOpen = false;
let cmdIndex = 0;
let cmdItemsCache = [];

/* =========================
   OPEN WITH "/"
========================= */

document.addEventListener("keydown", (e) => {

    const active = document.activeElement?.tagName;

    // לא לפתוח אם בתוך input אחר
    if (active === "INPUT" || active === "TEXTAREA") {

        // ניווט בתוך הפלט של הקומנד
        if (cmdOpen) {
            handleCmdNavigation(e);
        }

        return;
    }

    // OPEN CMD
    if (e.key === "/") {

        e.preventDefault();
        openCmdPalette();
    }

    if (cmdOpen) {
        handleCmdNavigation(e);
    }

}, true);

/* =========================
   OPEN / CLOSE
========================= */

function openCmdPalette() {

    const el = document.getElementById("cmdPalette");
    const input = document.getElementById("cmdInput");

    if (!el) return;

    cmdOpen = true;
    cmdIndex = 0;

    el.style.display = "flex";

    setTimeout(() => {

        if (input) {
            input.value = "";
            input.focus();
        }

        renderCmdPalette();

    }, 30);
}

function closeCmdPalette() {

    cmdOpen = false;
    cmdIndex = 0;
    cmdItemsCache = [];

    const el = document.getElementById("cmdPalette");
    const input = document.getElementById("cmdInput");
    const box = document.getElementById("cmdResults");

    if (el) el.style.display = "none";
    if (input) input.value = "";
    if (box) box.innerHTML = "";
}

/* =========================
   NAVIGATION (ARROWS)
========================= */

function handleCmdNavigation(e) {

    if (!cmdOpen) return;

    const items = cmdItemsCache;

    if (!items.length) return;

    if (e.key === "Escape") {
        closeCmdPalette();
        return;
    }

    if (e.key === "ArrowDown") {

        e.preventDefault();
        cmdIndex = Math.min(cmdIndex + 1, items.length - 1);
        renderCmdHighlight();
    }

    if (e.key === "ArrowUp") {

        e.preventDefault();
        cmdIndex = Math.max(cmdIndex - 1, 0);
        renderCmdHighlight();
    }

    if (e.key === "Enter") {

        e.preventDefault();

        const item = items[cmdIndex];
        if (item) openFromCmd(item.id);
    }
}

/* =========================
   RENDER
========================= */

function renderCmdPalette() {

    const input = document.getElementById("cmdInput");
    const box = document.getElementById("cmdResults");

    if (!input || !box) return;

    const q = input.value.toLowerCase();

    let items = App.queries || [];

    if (q) {
        items = items.filter(x =>
            (x.name || "").toLowerCase().includes(q) ||
            (x.id || "").toLowerCase().includes(q) ||
            (x.description || "").toLowerCase().includes(q) ||
            (x.module || "").toLowerCase().includes(q)
        );
    }

    if (q) {

    cmdItemsCache = items.slice(0,50);

} else {

    cmdItemsCache = items;

}
    cmdIndex = 0;

    renderCmdList();
}

/* =========================
   LIST RENDER
========================= */

function renderCmdList() {

    const box = document.getElementById("cmdResults");

    if (!box) return;

    const items = cmdItemsCache;

    box.innerHTML = items.map((q, i) => `
        <div class="cmd-item ${i === cmdIndex ? "active" : ""}"
             onclick="openFromCmd('${q.id}')">

            <div>
                <div class="cmd-title">${escapeHtml(q.name || "")}</div>
                <div class="cmd-sub">${escapeHtml(q.description || "")}</div>
            </div>

            <div class="cmd-tag">${q.module || "general"}</div>

        </div>
    `).join("");
}

/* =========================
   HIGHLIGHT UPDATE ONLY
========================= */

function renderCmdHighlight() {

    const items = document.querySelectorAll(".cmd-item");

    items.forEach((el, i) => {

        if (i === cmdIndex) {
            el.classList.add("active");
            el.scrollIntoView({ block: "nearest" });
        } else {
            el.classList.remove("active");
        }
    });
}

/* =========================
   EXECUTE
========================= */

function openFromCmd(id) {

    closeCmdPalette();
    openQuery(id);
}

/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function moduleColor(module) {

    if (!module) return "#64748b";

    module = module.toLowerCase().trim();

    if (moduleColorMap[module]) {
        return moduleColorMap[module];
    }

    const index = Object.keys(moduleColorMap).length % colorPalette.length;

    moduleColorMap[module] = colorPalette[index];

    localStorage.setItem("moduleColorMap", JSON.stringify(moduleColorMap));

    return moduleColorMap[module];
}
/* expose */
window.renderDashboard = renderDashboard;
window.renderQuery = renderQuery;
window.renderTable = renderTable;
window.backToDashboard = backToDashboard;
