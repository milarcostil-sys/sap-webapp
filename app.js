const API_BASE =
"https://mechanism-intermediate-glad-hour.trycloudflare.com";

async function login() {

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    const errorBox =
        document.getElementById("loginError");

    if(errorBox){

        errorBox.style.display = "none";
        errorBox.innerText = "";
    }

    try {

        const res = await fetch(
            API_BASE + "/login",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    username,
                    password
                })
            }
        );

        const data = await res.json();

        if(data.token){

            localStorage.setItem(
                "token",
                data.token
            );

            window.location.href =
                "dashboard.html";

        } else {

            if(errorBox){

                errorBox.innerText =
                    data.detail || "Login failed";

                errorBox.style.display =
                    "block";
            }
        }

    } catch(err) {

        if(errorBox){

            errorBox.innerText =
                "Cannot connect to server";

            errorBox.style.display =
                "block";
        }
    }
}

async function getItem(){

    const code =
        document.getElementById("itemCode").value;

    const token =
        localStorage.getItem("token");

    const res = await fetch(
        API_BASE + "/item/" + code,
        {
            headers:{
                "Authorization":
                    "Bearer " + token
            }
        }
    );

    const data = await res.json();

    document.getElementById("result").innerText =
        JSON.stringify(data, null, 2);
}

function logout(){

    localStorage.removeItem("token");

    window.location.href =
        "index.html";
}
