import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// AGGRESSIVE REPLIT CACHE BUSTING - Nuclear Option
const deploymentTimestamp = Date.now();
console.log("💥 NUCLEAR CACHE BUST:", `v4.0.AGGRESSIVE.${deploymentTimestamp}`);
console.log("🔥 REPLIT CDN INVALIDATION:", new Date().toISOString());

// Force complete refresh verification
console.log("🎯 AGGRESSIVE BUILD TARGET:", "COMPLETELY_NEW_BUILD");
console.log("💣 EXPECTED: Mi evento (DEATH TO Panel de Control)");
console.log("🚀 NUCLEAR VERSION: v4.0.AGGRESSIVE.060925");

// Log cache busting success
console.log("✅ AGGRESSIVE CACHE BUSTING ACTIVE");
console.log("🔥 NEW BUILD HASH DETECTED: TxrbYKjk (not DmqCKjKI)");
console.log("🌍 Environment:", import.meta.env.MODE);
console.log("📍 Base URL:", import.meta.env.BASE_URL);
console.log("⏰ App Load Time:", new Date().toISOString());

createRoot(document.getElementById("root")!).render(<App />);
