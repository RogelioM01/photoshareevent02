import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force deployment update - Cache busting
console.log("🔥 DEPLOYMENT FORCE UPDATE:", "v3.1.FORCE.1757144600000");
console.log("⏰ Deployment Time:", new Date().toISOString());

// Version logging
console.log("🔥 APP LOADED - VERSION: v3.1.FORCE.240925");
console.log("🌍 Environment:", import.meta.env.MODE);
console.log("📍 Base URL:", import.meta.env.BASE_URL);
console.log("⏰ App Load Time:", new Date().toISOString());

createRoot(document.getElementById("root")!).render(<App />);
