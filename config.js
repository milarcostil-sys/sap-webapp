const CONFIG = {
    local: "http://localhost:8000",
    production: "/api"
};

// מחליפים רק את השורה הזאת
const ENV = "production";

const API_BASE = CONFIG[ENV];
