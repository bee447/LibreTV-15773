const WebSocket = require("ws");
const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params: params || {}}));
}

ws.on("open", () => {
  send("Network.getAllCookies");
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id && msg.result?.cookies) {
      const cookies = msg.result.cookies;
      console.log("Cookies found: " + cookies.length);
      
      for (const c of cookies) {
        if (c.domain.includes("netlify") || c.name.match(/nf_|token|auth|session/i)) {
          console.log(c.name + " / " + c.domain + " / httpOnly:" + c.httpOnly + " / " + c.value.substring(0, 80));
        }
      }
      
      // Also check for api.netlify cookies
      console.log("\n--- API domain cookies ---");
      for (const c of cookies) {
        if (c.domain.includes("api.netlify")) {
          console.log(c.name + " = " + c.value.substring(0, 60));
        }
      }
      
      process.exit(0);
    }
  } catch(e) {}
});

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 5000);
