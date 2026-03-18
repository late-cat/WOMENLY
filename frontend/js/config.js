// API base URL with optional runtime override for deployments.
// Example: window.__WOMENLY_API_URL__ = "https://api.example.com"
var defaultApiOrigin = (window.location.origin && window.location.origin !== 'null')
    ? window.location.origin
    : 'http://localhost:8000';
const API_URL = (window.__WOMENLY_API_URL__ || defaultApiOrigin).replace(/\/+$/, "");
