"use strict";
const mode = localStorage.getItem("uiMode") || "desktop";

document.body.classList.remove("mode-desktop", "mode-mobile");
document.body.classList.add(mode === "mobile" ? "mode-mobile" : "mode-desktop");

if (mode === "mobile") {
    document.body.classList.add("mobile-mode");
}
/* =========================
   MAIN SELF-CONTAINED STATE
========================= */


/* צבעים מקומיים ל־MAIN בלבד */
const MAIN_COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#14b8a6"
];

const MAIN_STATE = {
    queries: [],
    moduleColorMap: {}
};

/* =========================
   INIT (SAFE - NO AUTO LOGOUT)
========================= */

window.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    applyTheme(localStorage.getItem("themeMode") || "dark");

    try {

        await loadQueriesSafe();

        renderMainModules();

     showModeBadge();

    } catch (err) {

        console.error("MAIN INIT ERROR:", err);

        // ❌ חשוב: לא מוחקים token יותר
        // רק נופלים UI fallback
        renderErrorState(err);
    }
});

/* =========================
   SAFE LOAD
========================= */

async function loadQueriesSafe() {

    const token = localStorage.getItem("token");

    const res = await fetch(API_BASE + "/queries", {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    if (!res.ok) {
        throw new Error("Failed to load queries: " + res.status);
    }

    MAIN_STATE.queries = await res.json();
}

/* =========================
   MODULES
========================= */

function getModules() {

    const set = new Set();

    MAIN_STATE.queries.forEach(q => {
        set.add(q.module || "general");
    });

    return [...set].sort();
}

/* =========================
   COUNTERS
========================= */

function getModuleStats() {

    const stats = {};

    MAIN_STATE.queries.forEach(q => {

        const m = (q.module || "general").toLowerCase();

        stats[m] = (stats[m] || 0) + 1;
    });

    return stats;
}

/* =========================
   COLOR ENGINE (LOCAL ONLY)
========================= */

function getMainModuleColor(module) {

    if (!module) return "#64748b";

    const key = module.toLowerCase().trim();

    if (MAIN_STATE.moduleColorMap[key]) {
        return MAIN_STATE.moduleColorMap[key];
    }

    const index = Object.keys(MAIN_STATE.moduleColorMap).length % MAIN_COLORS.length;

    MAIN_STATE.moduleColorMap[key] = MAIN_COLORS[index];

    return MAIN_STATE.moduleColorMap[key];
}

/* =========================
   MAIN RENDER
========================= */

function renderMainModules() {

    const container = document.querySelector("#mainContent .content-wrapper");

    if (!container) {
        console.warn("MAIN: container missing");
        return;
    }

    const modules = getModules();
    const stats = getModuleStats();

    if (!modules.length) {
        container.innerHTML = `
            <div class="card">
                <div class="card-title">No modules found</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="modules-grid">
            ${modules.map((m, i) => {

                const color = getMainModuleColor(m);
                const count = stats[m.toLowerCase()] || 0;

                return `
                <div class="module-card"
                     style="--accent:${color}; animation-delay:${i * 60}ms"
                     onclick="openModule('${m}')">

                    <div class="module-top">

                        <div class="module-badge" style="background:${color}">
                            ${count}
                        </div>

                    </div>

                    <div class="module-title">
                        ${escapeHtml(m)}
                    </div>

                    <div class="module-sub">
                        ${count} queries available
                    </div>

                    <button class="module-open-btn"
                            style="background:${color}"
                            onclick="event.stopPropagation(); openModule('${m}')">
                        ▶ 
                    </button>

                </div>
                `;
            }).join("")}
        </div>
    `;
}

/* =========================
   OPEN MODULE
========================= */

function openModule(module) {

    localStorage.setItem("activeModule", module);
    localStorage.setItem("moduleSource", "main"); // 🔥 תוסיף זה

    const mode = (localStorage.getItem("uiMode") || "desktop").toLowerCase();

    const routes = {
        mobile: "dashboard.mobile.html",
        desktop: "dashboard.html"
    };

    window.location.href = routes[mode] || routes.desktop;
}
/* =========================
   THEME (LOCAL COPY)
========================= */

function applyTheme(mode) {

    document.body.classList.remove("theme-light", "theme-dark");

    document.body.classList.add(
        mode === "light" ? "theme-light" : "theme-dark"
    );

    localStorage.setItem("themeMode", mode);
}

/* =========================
   MODE BADGE
========================= */

function showModeBadge() {

    const el = document.createElement("div");

    el.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        background: rgba(0,0,0,0.65);
        color: #fff;
        z-index: 99999;
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
    `;

    el.innerText =
        `MODE: ${(localStorage.getItem("uiMode") || "desktop").toUpperCase()}
         | THEME: ${(localStorage.getItem("themeMode") || "dark").toUpperCase()}`;

//    document.body.appendChild(el);
}

/* =========================
   ERROR SAFE UI
========================= */

function renderErrorState(err) {

    const container = document.querySelector("#mainContent .content-wrapper");

    if (!container) return;

    container.innerHTML = `
        <div class="card" style="border-left:4px solid #ef4444;">
            <div class="card-title">MAIN ERROR</div>
            <div class="card-desc">
                ${escapeHtml(err.message || "Unknown error")}
            </div>
        </div>
    `;
}

/* =========================
   ESCAPE
========================= */

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}
function goQueries() {
    localStorage.removeItem("activeModule");
    localStorage.removeItem("moduleSource");

    const mode =
        (localStorage.getItem("uiMode") || "desktop")
            .toLowerCase();

    window.location.href =
        mode === "mobile"
            ? "dashboard.mobile.html"
            : "dashboard.html";
}