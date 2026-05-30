
const API_BASE =
"https://mechanism-intermediate-glad-hour.trycloudflare.com";

/* =========================
   LOGIN
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
   INIT DASHBOARD
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
   ROUTER
========================= */

function showModule(module) {

    const app = document.getElementById("app");

    if (!app) return;

    if (module === "home") {

        app.innerHTML = `
            <h1>Dashboard</h1>

            <p>Welcome to Arcosteel ERP</p>
        `;
    }

    if (module === "items") {

        app.innerHTML = `
            <h2>Items Search</h2>

            <div class="search-box">
                <input id="itemCode" placeholder="Item Code">
                <button onclick="getItem()">Search</button>
            </div>

            <div id="results"></div>
        `;
    }

    if (module === "stock") {
        app.innerHTML = `<h2>Stock</h2>`;
    }

    if (module === "prices") {
        app.innerHTML = `<h2>Prices</h2>`;
    }

    if (module === "purchase") {
        app.innerHTML = `<h2>Purchase</h2>`;
    }
}

/* =========================
   ITEM SEARCH
========================= */

async function getItem() {

    const code = document.getElementById("itemCode").value;
    const token = localStorage.getItem("token");

    const res = await fetch(API_BASE + "/item/" + code, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const data = await res.json();

    const results = document.getElementById("results");

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
}

/* =========================
   LOGOUT
========================= */

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
