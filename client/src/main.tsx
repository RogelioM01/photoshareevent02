import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force deployment update - Cache busting with unique timestamp
const deploymentTimestamp = Date.now();
console.log("🔥 DEPLOYMENT FORCE UPDATE:", `v3.2.REPLIT.${deploymentTimestamp}`);
console.log("⏰ Deployment Time:", new Date().toISOString());

// Version logging with deployment timestamp
console.log("🔥 APP LOADED - VERSION: v3.2.REPLIT.240925");
console.log("🌍 Environment:", import.meta.env.MODE);
console.log("📍 Base URL:", import.meta.env.BASE_URL);
console.log("⏰ App Load Time:", new Date().toISOString());

createRoot(document.getElementById("root")!).render(<App />);
