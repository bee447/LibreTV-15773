const WebSocket = require("ws");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
const pending = {};

ws.on("open", () => {
  // Explore the netlify global object
  send("Runtime.evaluate", {expression: "typeof netlify === 'object' ? Object.keys(netlify).join(\", \") : 'not found'"});
  
  setTimeout(() => {
    // Check for any API client in the page (Apollo, GraphQL, etc.)
    send("Runtime.evaluate", {expression: "typeof window.__APOLLO_CLIENT__ !== 'undefined' ? 'Has Apollo' : typeof window.__NEXT_DATA__ !== 'undefined' ? 'Next.js: ' + Object.keys(__NEXT_DATA__).join(\",\") : 'Checking...'"});
  }, 1000);
  
  setTimeout(() => {
    // Navigate to a fresh deploys page (no error state)
    send("Page.navigate", {url: "https://app.netlify.com/sites/voluble-palmier-aada61/deploys"});
  }, 2000);
  
  setTimeout(() => {
    // After navigation, check the page structure
    send("Runtime.evaluate", {expression: "window.location.href"});
    send("Runtime.evaluate", {expression: "document.querySelector('[data-testid=\"dropzone\"]') ? 'Has dropzone' : 'No dropzone'"});
    send("Runtime.evaluate", {expression: "document.querySelector('input[type=file]') ? 'Has file input' : 'No file input'"});
    send("Runtime.evaluate", {expression: "document.querySelector('[class*=drop]') ? 'Has drop element' : document.querySelector('[class*=upload]') ? 'Has upload element' : 'No drag elements found'"});
  }, 8000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log("=>", val);
    }
  } catch(e) {}
});

function send(method, params) {
  msgId++;
  pending[msgId] = method;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 30000);
