const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);

let msgId = 0;
const pending = {};

ws.on("open", () => {
  console.log("Connected!");
  
  // Get nf_jwt token
  send("Runtime.evaluate", {expression: "localStorage.getItem(\"nf_jwt\")", returnByValue: true});
  // Get nf_session
  send("Runtime.evaluate", {expression: "localStorage.getItem(\"nf-session\")", returnByValue: true});
  // Get all keys and values together
  send("Runtime.evaluate", {expression: "(function(){var r={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);r[k]=localStorage.getItem(k).substring(0,100)}return JSON.stringify(r)})()", returnByValue: false});
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending[msg.id]) {
      console.log("Response for", pending[msg.id] + ":");
      const r = msg.result;
      if (r?.result?.value) {
        console.log("  value:", r.result.value);
      } else if (r?.result?.type === "string" && !r?.result?.value) {
        console.log("  type=string, null/empty");
      } else {
        console.log("  full result:", JSON.stringify(r).substring(0, 300));
      }
      delete pending[msg.id];
    }
  } catch(e) {}
});

function send(method, params) {
  msgId++;
  pending[msgId] = method;
  ws.send(JSON.stringify({id: msgId, method, params: params || {}}));
}

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 5000);
