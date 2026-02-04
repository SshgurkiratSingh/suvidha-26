export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Socket URL dynamically determined from current hostname
// Connecting to the main backend which now handles sockets on port 4000
export const SOCKET_URL = `http://${window.location.hostname}:4000`;
