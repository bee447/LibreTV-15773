const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";

// Connect via WebSocket
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);

let msgId = 0;
const pending = {};

ws.on("open", () => {
  console.log("WebSocket connected!");
  
  // Navigate again just to be sure
  send("Page.navigate", {url: "https://app.netlify.com/sites/voluble-palmier-aada61/deploys"});
  
  // Wait for navigation then get auth
  setTimeout(() => {
    // Get nf_jwt from localStorage
    send("Runtime.evaluate", {expression: "localStorage.getItem(\"nf_jwt\")"});
    // Get all localStorage keys
    send("Runtime.evaluate", {expression: "JSON.stringify(Object.keys(localStorage))"});
    // Get cookies
    send("Runtime.evaluate", {expression: "document.cookie"});
    // Get page URL
    send("Runtime.evaluate", {expression: "window.location.href"});
  }, 3000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending[msg.id]) {
      const result = msg.result?.result?.value;
      if (result) console.log(msg.method + ":", result.substring(0, 300));
      delete pending[msg.id];
    }
  } catch(e) {}
});

function send(method, params) {
  msgId++;
  pending[msgId] = method;
  ws.send(JSON.stringify({id: msgId, method, params: params || {}}));
}

ws.on("error", (err) => console.error("WS Error:", err.message));
ws.on("close", () => console.log("WS closed"));

// Keep running
setTimeout(() => process.exit(0), 15000);
