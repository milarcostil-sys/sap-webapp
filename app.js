const API_BASE =
"https://mechanism-intermediate-glad-hour.trycloudflare.com";

/* =========================
   AUTO PROTECT DASHBOARD
========================= */

if (
    window.location.pathname.includes("dashboard.html")
) {

    const token =
        localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "index.html";
    }
}

/* =========================
   LOGIN
========================= */

async function login() {

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    const errorBox =
        document.getElementById("loginError");

    if (errorBox) {

        errorBox.style.display = "none";
        errorBox.innerText = "";
    }

    try {

        const res = await fetch(
            API_BASE + "/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );

        const data = await res.json();

        if (data.token) {

            localStorage.setItem(
                "token",
                data.token
            );

            window.location.href =
                "dashboard.html";

        } else {

            if (errorBox) {

                errorBox.innerText =
                    data.detail || "Login failed";

                errorBox.style.display =
                    "block";
            }
        }

    } catch (err) {

        if (errorBox) {

            errorBox.innerText =
                "Cannot connect to server";

            errorBox.style.display =
                "block";
        }
    }
}

/* =========================
   ITEM SEARCH
========================= */

async function getItem() {

    const code =
        document.getElementById("itemCode").value;

    const token =
        localStorage.getItem("token");

    const result =
        document.getElementById("result");

    if (!code) {

        result.innerHTML =
            `<div class="error-box">Please enter item code</div>`;

        return;
    }

    try {

        const res = await fetch(
            API_BASE + "/item/" + code,
            {
                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        const data = await res.json();

        /* ERROR FROM API */
        if (data.error) {

            result.innerHTML = `
                <div class="error-box">
                    ${data.error}
                </div>
            `;

            return;
        }

        /* SUCCESS CARD */
        result.innerHTML = `
            <div class="item-card">

                <h3>${data.ItemCode}</h3>

                <p>${data.ItemName}</p>

            </div>
        `;

    } catch (err) {

        result.innerHTML =
            `<div class="error-box">Server error</div>`;
    }
}

/* =========================
   SHOW SEARCH UI
========================= */

function showItemSearch() {

    document
        .getElementById("itemCode")
        .focus();
}

/* =========================
   LOGOUT
========================= */

function logout() {

    localStorage.removeItem("token");

    window.location.href =
        "index.html";
}
function showModule(module){

    const app =
        document.getElementById("app");

    if(module === "search"){

        app.innerHTML = `
            <h2>Item Search</h2>

            <input id="itemCode" placeholder="Enter Item Code">

            <button onclick="getItem()">Search</button>

            <div id="result" class="result-card">Waiting...</div>
        `;
    }

    else if(module === "inventory"){

        app.innerHTML = `
            <h2>Inventory</h2>
            <p>Module under development</p>
        `;
    }

    else if(module === "prices"){

        app.innerHTML = `
            <h2>Prices</h2>
            <p>Module under development</p>
        `;
    }

    else if(module === "purchase"){

        app.innerHTML = `
            <h2>Purchasing</h2>
            <p>Module under development</p>
        `;
    }
}
function showModule(module){

    const app =
        document.getElementById("app");

    if(module === "home"){

        app.innerHTML = `
            <h1>Welcome to Arcosteel ERP</h1>

            <div class="dashboard-cards">

                <div class="dash-card" onclick="showModule('items')">
                    🔍<br>Items
                </div>

                <div class="dash-card" onclick="showModule('stock')">
                    📦<br>Stock
                </div>

                <div class="dash-card" onclick="showModule('prices')">
                    💰<br>Prices
                </div>

                <div class="dash-card" onclick="showModule('purchase')">
                    🚚<br>Purchase
                </div>

            </div>
        `;
    }

    if(module === "items"){

        app.innerHTML = `
            <h2>Items Module</h2>
            <p>Here you will connect SAP queries</p>
        `;
    }

    if(module === "stock"){

        app.innerHTML = `
            <h2>Stock Module</h2>
            <p>Stock data will appear here</p>
        `;
    }

    if(module === "prices"){

        app.innerHTML = `
            <h2>Prices Module</h2>
            <p>Price lists module</p>
        `;
    }

    if(module === "purchase"){

        app.innerHTML = `
            <h2>Purchase Module</h2>
            <p>Purchase history module</p>
        `;
    }
}
