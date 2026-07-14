
const PAGE =
    window.location.pathname.split("/").pop() || "index.html";

const IS_MAIN = PAGE === "main.html";
const IS_DASHBOARD = !IS_MAIN;

const UI_MODE = localStorage.getItem("uiMode") || "desktop";
const THEME_MODE = localStorage.getItem("themeMode") || "dark";

const App = {
    queries: [],

    activeModule: "",

    // סינון חד פעמי מה-MAIN
    initialModule: "",

    currentQuery: null,
    lastResult: null,

 favorites: new Set(),

    showFavorites: false,

    sortField: null,
    sortDirection: "asc",

    resultFilter: "",
    queryModalOpen: false

};

/* =========================
   INIT
========================= */
/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");

    const page = PAGE;

    const publicPages = ["index.html"];

    // =========================
    // AUTH CHECK
    // =========================
    if (!token && !publicPages.includes(page)) {
        location.href = "index.html";
        return;
    }

    if (!token) return;

    // =========================
    // THEME
    // =========================
    applyTheme(localStorage.getItem("themeMode") || "dark");

    // =========================
    // MAIN PAGE STOP
    // =========================
    if (IS_MAIN) {
        return;
    }

    // =========================
    // DASHBOARD INIT
    // =========================
    try {

        await loadQueries();
        await loadFavorites();
        fillModules();

        // =========================
        // MODULE FROM MAIN NAV
        // =========================
        const savedModule =
            localStorage.getItem("activeModule");

        // סינון חד פעמי שמגיע מה-MAIN
        App.initialModule =
            savedModule || "";

        // activeModule כבר לא משמש לסינון
        App.activeModule = "";

        // ניקוי כדי שלא יישאר לדפים הבאים
        localStorage.removeItem(
            "activeModule"
        );

        // =========================
        // SYNC SELECT
        // =========================
        const select =
            document.getElementById(
                "moduleFilter"
            );

        if (select && App.initialModule) {
            select.value =
                App.initialModule;
        }

        // =========================
        // FIRST RENDER
        // =========================
        renderDashboard();

    } catch (err) {

        console.error(err);

        localStorage.clear();

        location.href =
            "index.html";
    }
});

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const otp =
            document.getElementById(
                "otpInput"
            );

        if (!otp) return;

        otp.addEventListener(
            "keydown",
            function(e) {

                if (e.key === "Enter") {
                    verifyOtp();
                }
            }
        );
    }
);

// =========================
// ESC CLOSE ALL MODALS
// =========================
document.addEventListener(
    "keydown",
    function(e) {

        if (e.key !== "Escape") return;


        // =====================
        // OTP
        // =====================
        const otpModal =
            document.getElementById("otpModal");

        if (
            otpModal &&
            !otpModal.classList.contains("hidden")
        ) {

            closeOtpModal();
            return;

        }


        // =====================
        // QUERY PARAMETERS
        // =====================
        if (App.queryModalOpen) {

            closeQueryModal();
            return;

        }


        // =====================
        // DRILL
        // =====================
        const drillModal =
            document.getElementById("drillModal");

        if (
            drillModal &&
            !drillModal.classList.contains("hidden")
        ) {

            closeDrill();
            return;

        }


        // =====================
        // LOGOUT
        // =====================
        const logoutModal =
            document.getElementById("logoutModal");

        if (
            logoutModal &&
            !logoutModal.classList.contains("hidden")
        ) {

            closeLogoutModal();
            return;

        }

    }
);

function openOtpModal(username) {

    window.pendingUser = username;

    const modal =
        document.getElementById(
            "otpModal"
        );

    modal.classList.remove(
        "hidden"
    );

    const input =
        document.getElementById(
            "otpInput"
        );

    input.value = "";

    document
        .getElementById(
            "otpMessage"
        )
        .style.display = "none";

    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);
}

/* =========================
   LOAD
========================= */
async function loadQueries() {

    const token = localStorage.getItem("token");

    // טעינת השאילתות
    const res = await fetch(API_BASE + "/queries", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    App.queries = await res.json();

    // טעינת המועדפים של המשתמש
    const favRes = await fetch(API_BASE + "/user/favorites", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (favRes.ok) {

        const favData = await favRes.json();

        App.favorites = new Set(
            favData.favorites || []
        );
    }
}

async function loadFavorites() {

    const token = localStorage.getItem("token");

    const res = await fetch(
        API_BASE + "/user/favorites",
        {
            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    );

    if (!res.ok) {
        console.error(
            "Failed loading favorites"
        );
        return;
    }

    const data = await res.json();

    App.favorites = new Set(
        data.favorites || []
    );
}

/* =========================
   MODULES
========================= */
function getModules() {
    return [...new Set(App.queries.map(q => q.module || "general"))].sort();
}

function fillModules() {

    const select = document.getElementById("moduleFilter");
    if (!select) return;

    const modules = getModules();

    select.innerHTML = `<option value="">All Modules</option>`;

    modules.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
    });
}

/* =========================
   FAVORITES
========================= */
async function toggleFavorite(id) {

    if (App.favorites.has(id)) {
        App.favorites.delete(id);
    } else {
        App.favorites.add(id);
    }

    renderDashboard();

    const token = localStorage.getItem("token");

    try {

        await fetch(
            API_BASE + "/user/favorites",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    favorites: [...App.favorites]
                })
            }
        );

    } catch (err) {

        console.error(
            "Failed saving favorites",
            err
        );

    }
}
function toggleFavorites() {
    App.showFavorites = !App.showFavorites;
    renderDashboard();
}


/* =========================
   OPEN QUERY
========================= */
/* =========================
   OPEN QUERY
========================= */

async function openQuery(id) {

    App.lastResult = null;
    App.resultFilter = "";
    App.sortField = null;
    App.sortDirection = "asc";


    const token = localStorage.getItem("token");


    const res = await fetch(
        API_BASE + "/query/" + id,
        {
            headers:{
                "Authorization":
                "Bearer " + token
            }
        }
    );


    if (!res.ok){

        alert("Failed loading query");
        return;

    }


    App.currentQuery =
        await res.json();



    const params =
        App.currentQuery.parameters || [];



    // ==================================
    // NO PARAMETERS
    // DIRECT EXECUTE
    // ==================================

  if(params.length === 0){

    renderQuery(App.currentQuery);

    await runQuery(id);

    return;

}

    // ==================================
    // HAS PARAMETERS
    // OPEN MODAL
    // ==================================

    openQueryModal(
        App.currentQuery
    );

}

function closeQueryModal(){

    const modal =
        document.getElementById(
            "queryParamModal"
        );

    if(modal){

        modal.classList.add(
            "hidden"
        );

    }

    App.queryModalOpen = false;
}

function openQueryModal(query){

    const modal =
        document.getElementById(
            "queryParamModal"
        );


    document.getElementById(
        "queryModalTitle"
    ).innerText =
        query.name || "";


    document.getElementById(
        "queryModalDesc"
    ).innerText =
        query.description || "";


    let html = "";


    (query.parameters || [])
    .forEach(p => {

        html += `

        <div class="query-field">

            <label>
                ${escapeHtml(p.label || "")}
            </label>

            ${renderInput(p)}

        </div>

        `;

    });


    document.getElementById(
        "queryModalFields"
    ).innerHTML = html;


    modal.classList.remove(
        "hidden"
    );


    App.queryModalOpen = true;
}
function executeModalQuery() {

    closeQueryModal();

    renderQuery(
        App.currentQuery
    );

    runQuery(
        App.currentQuery.id
    );

}
/* =========================
   BACK
========================= */
/* =========================
   BACK
========================= */
function backToDashboard() {

    App.currentQuery = null;
    App.lastResult = null;
    App.resultFilter = "";

    const content =
        document.getElementById("content");

    const area =
        document.getElementById("query-area");


    if (content) {
        content.style.display = "block";
    }

    if (area) {
        area.innerHTML = "";
    }


    renderDashboard();
}
/* =========================
   RUN QUERY
========================= */

/* =========================
   RUN QUERY
========================= */

async function runQuery(id) {

    const token =
        localStorage.getItem("token");


    const body = {};


    // =========================
    // READ PARAMETERS
    // =========================

    const inputs =
        document.querySelectorAll(
            "#queryParamModal input, .query-form input"
        );


    inputs.forEach(i => {

        body[i.id] = i.value;

    });



    // =========================
    // FIND RESULTS AREA
    // =========================

    const results =
        document.getElementById("results");


    if (!results) {

        console.error(
            "Missing #results container"
        );

        return;
    }



    // =========================
    // LOADING
    // =========================

    results.innerHTML = `

        <div class="card">

            <div class="card-title">
                Running query...
            </div>

        </div>

    `;



    try {


        // =========================
        // EXECUTE QUERY
        // =========================

        const res = await fetch(

            API_BASE + "/query/" + id + "/run",

            {
                method:"POST",

                headers:{

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " + token
                },

                body:
                    JSON.stringify(body)
            }

        );



        if (!res.ok) {

            results.innerHTML = `

                <div class="card">

                    <div class="card-title">
                        Query failed
                    </div>

                </div>

            `;

            return;
        }



        // =========================
        // SAVE RESULT
        // =========================

        App.lastResult =
            await res.json();



        App.resultFilter = "";

        App.sortField = null;

        App.sortDirection = "asc";



        // =========================
        // RENDER TABLE
        // =========================

        renderTable(
            App.lastResult
        );


    } catch(err) {


        console.error(
            "Query error:",
            err
        );


        results.innerHTML = `

            <div class="card">

                <div class="card-title">
                    Server error
                </div>

            </div>

        `;

    }

}
/* =========================
   EXPORT EXCEL
========================= */
async function exportExcel() {

    if (!App.lastResult) {
        alert("Run query first");
        return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch(
        API_BASE + "/export/excel",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                query_name: App.currentQuery.name,
                ...App.lastResult
            })
        }
    );

    if (!res.ok) {
        alert("Export failed");
        return;
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =
        `${App.currentQuery.name}.xlsx`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);
}

/* =========================
   EXPORT PDF
========================= */
async function exportPDF() {

    if (!App.lastResult) {
        alert("Run query first");
        return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch(
        API_BASE + "/query/export/pdf",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                query_name: App.currentQuery.name,
                ...App.lastResult
            })
        }
    );

    if (!res.ok) {
        alert("Export failed");
        return;
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =
        `${App.currentQuery.name}.pdf`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);
}

function showLoginMessage(msg, type = "error") {

    const el = document.getElementById("loginMessage");

    if (!el) return;

    el.style.display = "block";
    el.className = `login-message ${type}`;
    el.innerText = msg;
}

async function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const uiMode = document.getElementById("uiMode").value;
    const themeMode = document.getElementById("themeMode").value;

    const res = await fetch(API_BASE + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

const data = await res.json();

// שגיאות
if (!res.ok) {

    if (data.detail === "User disabled") {
        showLoginMessage(
            "Your account is disabled. Contact admin.",
            "error"
        );
        return;
    }

    showLoginMessage(
        "Invalid username or password",
        "error"
    );
    return;
}

// =========================
// OTP REQUIRED
// =========================
if (data.status === "otp_required") {

    window.pendingUser = username;

    document
        .getElementById("otpModal")
        .classList.remove("hidden");

    return;
}

// =========================
// NORMAL LOGIN
// =========================
if (data.enabled === false) {

    showLoginMessage(
        "Your account is disabled. Contact admin.",
        "error"
    );

    return;
}

localStorage.setItem("token", data.token);
localStorage.setItem("uiMode", uiMode);
localStorage.setItem("themeMode", themeMode);

applyTheme(themeMode);
window.location.href = "main.html";

/*
    if (uiMode === "mobile") {
        window.location.href = "dashboard.mobile.html";
    } else {
        window.location.href = "dashboard.html";
    }
*/
}

let otpLoading = false;
async function verifyOtp() {

    // =========================
    // PREVENT DOUBLE SUBMIT
    // =========================
    if (otpLoading) return;

    const otpInput =
        document.getElementById(
            "otpInput"
        );

    const otp =
        otpInput
            .value
            .trim();

    // =========================
    // LOCAL VALIDATION
    // =========================
    if (!otp) {

        showOtpMessage(
            "Please enter verification code"
        );

        otpInput.focus();

        return;
    }

    if (!/^\d{6}$/.test(otp)) {

        showOtpMessage(
            "Verification code must contain 6 digits"
        );

        otpInput.focus();
        otpInput.select();

        return;
    }

    otpLoading = true;

    // =========================
    // CLEAR MESSAGE
    // =========================
    document.getElementById(
        "otpMessage"
    ).style.display = "none";

    // =========================
    // DISABLE INPUT
    // =========================
    otpInput.disabled = true;

    try {

        const res = await fetch(
            API_BASE + "/login/verify-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    username:
                        window.pendingUser,
                    otp: otp
                })
            }
        );

        const data =
            await res.json();

        // =========================
        // ERROR
        // =========================
        if (!res.ok) {

            otpLoading = false;

            otpInput.disabled = false;
            otpInput.focus();
            otpInput.select();

            if (
                data.detail ===
                "OTP expired"
            ) {

                showOtpMessage(
                    "Verification code expired"
                );

            } else if (
                data.detail ===
                "OTP not found"
            ) {

                showOtpMessage(
                    "Verification session expired"
                );

            } else {

                showOtpMessage(
                    "Invalid verification code"
                );
            }

            return;
        }

        // =========================
        // SUCCESS
        // =========================
        showOtpMessage(
            "Verification successful",
            "success"
        );

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "themeMode",
            document.getElementById(
                "themeMode"
            ).value
        );

        localStorage.setItem(
            "uiMode",
            document.getElementById(
                "uiMode"
            ).value
        );

        otpLoading = false;

        setTimeout(() => {

            window.location.href =
                "main.html";

        }, 500);

    } catch (err) {

        otpLoading = false;

        otpInput.disabled = false;

        showOtpMessage(
            "Server error"
        );

        otpInput.focus();
        otpInput.select();
    }
}

function showOtpMessage(msg, type = "error") {

    const el =
        document.getElementById("otpMessage");

    el.className = type;
    el.innerText = msg;
    el.style.display = "block";
}

function closeOtpModal() {

    const modal =
        document.getElementById("otpModal");

    const input =
        document.getElementById("otpInput");

    const message =
        document.getElementById("otpMessage");

    if (!modal) return;

    modal.classList.add("hidden");

    if (message) {
        message.style.display = "none";
    }

    if (input) {
        input.value = "";
        input.disabled = false;
    }
}

// =========================
// CLICK OUTSIDE MODAL CLOSE
// =========================
window.addEventListener("click", function(e) {

    const modal =
        document.getElementById("otpModal");

    if (!modal) return;

    if (e.target === modal) {
        closeOtpModal();
    }
});


// =========================
// ENTER SUBMIT
// =========================
document.addEventListener("DOMContentLoaded", () => {

    const otp =
        document.getElementById("otpInput");

    if (!otp) return;

    otp.addEventListener("keydown", function(e) {

        if (e.key === "Enter") {
            verifyOtp();
        }
    });
});

// =========================
// AUTO 6 DIGIT VALIDATION + AUTO SUBMIT
// =========================
document.addEventListener("DOMContentLoaded", () => {

    const otp =
        document.getElementById("otpInput");

    if (!otp) return;

    otp.addEventListener("input", function() {

        // רק ספרות
        this.value =
            this.value.replace(/\D/g, "");

        // חיתוך ל-6
        this.value =
            this.value.slice(0, 6);

        // auto submit
        if (this.value.length === 6) {
            verifyOtp();
        }
    });
});
/*function logout() {

    if (!confirm("Are you sure you want to logout?")) return;

    localStorage.clear();
    localStorage.removeItem("token");
    localStorage.removeItem("uiMode");
    localStorage.removeItem("favorites");

    window.location.href = "index.html";
}*/

// =========================
// LOGOUT MODAL
// =========================

function logout() {

    const modal =
        document.getElementById("logoutModal");

    if (!modal) return;

    modal.classList.remove("hidden");
}


function closeLogoutModal() {

    const modal =
        document.getElementById("logoutModal");

    if (!modal) return;

    modal.classList.add("hidden");
}


function confirmLogout() {

    localStorage.removeItem("token");

    window.location.href =
        "index.html";
}


// CLICK OUTSIDE
window.addEventListener("click", function(e) {

    const modal =
        document.getElementById("logoutModal");

    if (!modal) return;

    if (e.target === modal) {
        closeLogoutModal();
    }

});


function renderInput(param) {

    switch (param.type) {

        case "date":
            return `<input type="date" id="${param.name}">`;

        case "datetime":
            return `<input type="datetime-local" id="${param.name}">`;

        case "number":
            return `<input type="number" id="${param.name}">`;

        case "text":
        default:
            return `<input type="text" id="${param.name}">`;
    }
}
function sortTable(field) {

    if (!App.lastResult?.rows) return;

    if (App.sortField === field) {
        App.sortDirection =
            App.sortDirection === "asc"
                ? "desc"
                : "asc";
    } else {
        App.sortField = field;
        App.sortDirection = "asc";
    }

    App.lastResult.rows.sort((a, b) => {

        let va = a[field];
        let vb = b[field];

        if (va == null) va = "";
        if (vb == null) vb = "";

        /* NUMBER */
        const na = Number(va);
        const nb = Number(vb);

        if (!isNaN(na) && !isNaN(nb) && va !== "" && vb !== "") {

            return App.sortDirection === "asc"
                ? na - nb
                : nb - na;
        }

        /* DATE */
        const da = Date.parse(va);
        const db = Date.parse(vb);

        if (!isNaN(da) && !isNaN(db)) {

            return App.sortDirection === "asc"
                ? da - db
                : db - da;
        }

        /* TEXT */
        return App.sortDirection === "asc"
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va));
    });

    renderTable(App.lastResult);
}
function filterResults(value) {

    App.resultFilter = value;

    if (typeof Mobile !== "undefined" && Mobile.view === "query") {

        renderResultsMobile(App.lastResult);

    } else {

        renderTable(App.lastResult);

    }

    setTimeout(() => {

        const input = document.getElementById("resultFilter");

        if (input) {

            input.focus();
            input.selectionStart = input.value.length;
            input.selectionEnd = input.value.length;

        }

    }, 0);
}
/* =========================
   Drill MODEL
========================= */

async function openItemDrill(itemCode) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        API_BASE + "/drill/item/" + encodeURIComponent(itemCode),
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const data = await res.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    let rows = "";

    (data.fields || []).forEach(f => {

        rows += `
            <div class="drill-row">

                <div class="drill-label">
                    ${f.label}
                </div>

                <div class="drill-value">
                    ${f.value ?? ""}
                </div>

            </div>
        `;
    });

    document.getElementById("drillContent").innerHTML = `

        <div class="drill-header">

            <div class="drill-icon">
                📦
            </div>

            <div>

                <div class="drill-title">
                    ${data.title}
                </div>

                <div class="drill-subtitle">
                    Item Information
                </div>

            </div>

        </div>

        <div class="drill-body">

            ${rows}

        </div>

    `;

    document
    .getElementById("drillModal")
    .classList.remove("hidden");

}
function closeDrill() {

    document
        .getElementById("drillModal")
        .classList.add("hidden");
}

window.addEventListener("click", function(e) {

    const modal =
        document.getElementById(
            "drillModal"
        );

    if (e.target === modal) {

    closeDrill();
    }
});

function formatValue(value, format) {

    if (value == null || value === "") return "";

    const num = Number(value);

    switch (format) {

        case "number0":
            return isNaN(num)
                ? value
                : Math.round(num).toLocaleString("en-US");

       case "number2":
    return isNaN(num)
        ? value
        : num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        case "percent":
            return isNaN(num)
                ? value
                : (num * 100).toFixed(2) + "%";

        case "docnum":
            return String(value);

        default:
            return value;
    }
}
function requireLogin() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}
function applyTheme(mode) {
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(
        mode === "light"
            ? "theme-light"
            : "theme-dark"
    );

    localStorage.setItem(
        "themeMode",
        mode || "dark"
    );
}
function toggleTheme() {

    const currentMode =
        localStorage.getItem("themeMode") || "dark";

    const newMode =
        currentMode === "dark"
            ? "light"
            : "dark";

    applyTheme(newMode);

    const btn = document.getElementById("headerThemeBtn");

    if (btn) {
        btn.innerHTML =
            newMode === "dark"
                ? "🌙"
                : "☀️";
    }
}
document.addEventListener("DOMContentLoaded", () => {

    const mode =
        localStorage.getItem("themeMode") || "dark";

    applyTheme(mode);

   const btn = document.getElementById("headerThemeBtn");

if (btn) {
    btn.innerHTML =
        mode === "dark"
            ? "🌙"
            : "☀️";
}
});


window.addEventListener("load", () => {

    const splash = document.getElementById("splash");
    if (!splash) return;

    splash.style.transition = "opacity 0.3s ease";

    setTimeout(() => {
        splash.style.opacity = "0";

        setTimeout(() => {
            splash.remove();
        }, 300);

    }, 900);
});

