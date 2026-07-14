const CONFIG = {
    local: "http://localhost:8000",
    production: "/api"
};

const ENV = "production";

const API_BASE = CONFIG[ENV];
