const WebSocket = require("ws");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
const results = [];

ws.on("open", () => {
  // Get all cookies via CDP (includes httpOnly cookies!)
  send("Network.getAllCookies");
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id && msg.result?.cookies) {
      const cookies = msg.result.cookies;
      console.log("Cookies found: " + cookies.length);
      
      const netlifyCookies = cookies.filter(c => c.domain.includes("netlify") || c.domain.includes("api."));
      for (const c of netlifyCookies) {
        // Only show name/value and domain, not raw (for privacy/size)
        console.log("  " + c.name + " (domain: " + c.domain + ", path: " + c.path + ", httpOnly: " + c.httpOnly + ", secure: " + c.secure + ")");
        for (const c of netlifyCookies) {
          if (c.name.match(/token|auth|session|key/i) || c.name.startsWith("nf_")) {
            console.log("  Auth cookie: " + c.name + " = " + c.value.substring(0, 50) + (c.value.length > 50 ? "..." : ""));
          }
        }
      }
      
      // Save cookies for curl
      const cookieString = netlifyCookies.map(c => c.name + "=" + c.value).join("; ");
      console.log("\nCookies for API:\n" + cookieString.substring(0, 1000));
      
      process.exit(0);
    }
  } catch(e) {}
});

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 5000);
