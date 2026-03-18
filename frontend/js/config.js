// API base URL with optional runtime override for deployments.
// Example: window.__WOMENLY_API_URL__ = "https://api.example.com"
const API_URL = (window.__WOMENLY_API_URL__ || "http://localhost:8000").replace(/\/+$/, "");
