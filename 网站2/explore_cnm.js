const WebSocket = require("ws");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

ws.on("open", () => {
  // Explore netlify.cnm
  send("Runtime.evaluate", {expression: "typeof netlify.cnm === 'object' ? Object.keys(netlify.cnm).join(\", \") : 'cnm not object'"});
  
  setTimeout(() => {
    // Check for API methods like deploy, upload, createDeploy, etc.
    send("Runtime.evaluate", {expression: "typeof netlify.cnm === 'object' ? JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(netlify.cnm)).filter(n => n.includes('eploy') || n.includes('pload') || n.includes('reate') || n.includes('ite'))) : 'N/A'"});
  }, 1000);
  
  setTimeout(() => {
    // Try to list all available API methods
    send("Runtime.evaluate", {expression: "(function(){var proto=Object.getPrototypeOf(netlify.cnm);var names=Object.getOwnPropertyNames(proto);return JSON.stringify(names.filter(n=>typeof proto[n]==='function').slice(0,30))})()"});
  }, 2000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log("=>", val.substring(0, 800));
    }
  } catch(e) {}
});

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 20000);
