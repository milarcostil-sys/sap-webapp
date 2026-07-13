const CONFIG = {
    local: "http://localhost:8000",
    production: "https://api.arcosteelonline.com"
};

// מחליפים רק את השורה הזאת
const ENV = "production";

const API_BASE = CONFIG[ENV];
