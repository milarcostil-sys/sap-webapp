
const API_BASE =
"https://mechanism-intermediate-glad-hour.trycloudflare.com";

/* =========================
   AUTH
========================= */

async function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const error = document.getElementById("loginError");

    try {

        const res = await fetch(API_BASE + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.token) {

            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";

        } else {
            error.innerText = data.detail || "Login failed";
        }

    } catch (e) {
        error.innerText = "Server error";
    }
}

/* =========================
   INIT
========================= */

window.onload = function () {

    if (window.location.pathname.includes("dashboard")) {

        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "index.html";
            return;
        }

        showModule("home");
    }
};

/* =========================
   MODULE SYSTEM (NEW ARCHITECTURE)
========================= */

const Modules = {};

/* -------------------------
   HOME
------------------------- */

Modules.home = function () {

    return `
        <h1>Dashboard</h1>
        <p>Welcome to Arcosteel ERP</p>
    `;
};

/* -------------------------
   ITEMS (עם ACTION BAR)
------------------------- */

Modules.items = function () {

    return `
        <div class="module-header">

            <h2>Items Module</h2>

            <div class="action-bar">

                <button onclick="getItem()">Get Item</button>
                <button onclick="alert('Stock query')">Stock</button>
                <button onclick="alert('Price history')">Price</button>

            </div>

        </div>

        <div class="search-box">
            <input id="itemCode" placeholder="Item Code">
            <button onclick="getItem()">Search</button>
        </div>

        <div id="results"></div>
    `;
};

/* -------------------------
   STOCK
------------------------- */

Modules.stock = function () {
    return `<h2>Stock Module</h2>`;
};

/* -------------------------
   PRICES
------------------------- */

Modules.prices = function () {
    return `<h2>Prices Module</h2>`;
};

/* -------------------------
   PURCHASE
------------------------- */

Modules.purchase = function () {
    return `<h2>Purchase Module</h2>`;
};

/* =========================
   ROUTER (CLEAN)
========================= */

function showModule(name) {

    const app = document.getElementById("app");

    const module = Modules[name];

    if (!module) {
        app.innerHTML = "<h2>Module not found</h2>";
        return;
    }

    app.innerHTML = module();
}

/* =========================
   ITEM SEARCH API
========================= */

async function getItem() {

    const code = document.getElementById("itemCode").value;
    const token = localStorage.getItem("token");

    const results = document.getElementById("results");

    try {

        const res = await fetch(API_BASE + "/item/" + code, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        if (data.error) {
            results.innerHTML = data.error;
            return;
        }

        results.innerHTML = `
            <div>
                <h3>${data.ItemCode}</h3>
                <p>${data.ItemName}</p>
            </div>
        `;

    } catch (e) {
        results.innerHTML = "Server error";
    }
}

/* =========================
   LOGOUT
========================= */

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
