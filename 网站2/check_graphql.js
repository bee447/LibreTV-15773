const WebSocket = require("ws");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params: params || {}}));
}

ws.on("open", () => {
  // Check if page has any GraphQL endpoint
  send("Runtime.evaluate", {expression: "document.querySelector('link[rel*=graphql]') ? 'Has graphql link' : 'No graphql link'"});
  
  // Look for API endpoints in script data
  send("Runtime.evaluate", {expression: "window.__NEXT_DATA__ ? 'Has next data' : typeof window.__APOLLO_STATE__ !== 'undefined' ? 'Has Apollo state' : 'Neither found'"});
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log("=>", val.substring(0, 500));
      if (val && (val.includes("deploy") || val.includes("success"))) {
        console.log("DEPLOY SUCCESS!");
      }
    }
  } catch(e) {}
});

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 10000);
