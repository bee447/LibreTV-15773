const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("open", () => {
  // Navigate to GitHub repo
  send("Page.navigate", {url: "https://github.com/bee447/LibreTV-15773"});
  
  setTimeout(() => {
    // Check if logged in
    send("Runtime.evaluate", {expression: "document.querySelector('meta[name=\"user-login\"]')?.content || 'Not logged in'"});
    send("Runtime.evaluate", {expression: "document.title"});
    send("Runtime.evaluate", {expression: "window.location.href"});
    
    // Check for logged-in indicator
    send("Runtime.evaluate", {expression: "document.querySelector('.avatar') ? 'Has avatar (logged in)' : 'No avatar'"});
  }, 8000);
  
  setTimeout(() => {
    // Navigate to upload page
    send("Page.navigate", {url: "https://github.com/bee447/LibreTV-15773/upload/main"});
  }, 10000);
  
  setTimeout(() => {
    // Check upload page
    send("Runtime.evaluate", {expression: "window.location.href"});
    send("Runtime.evaluate", {expression: "document.querySelector('input[type=file]') ? 'Has file input' : 'No file input'"});
    send("Runtime.evaluate", {expression: "Array.from(document.querySelectorAll(\"input\")).map(i => i.type + ':' + i.className.substring(0,30)).join(', ')"});
    
    // Check for file upload zone
    send("Runtime.evaluate", {expression: "document.querySelector('[class*=\"drag\"]') ? 'Has drag zone' : document.querySelector('[class*=\"upload\"]') ? 'Has upload zone' : 'No upload elements'"});
  }, 18000);
  
  setTimeout(() => {
    // Get visible page text
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(0, 1500)"});
  }, 20000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log(val.substring(0, 1000));
    }
  } catch(e) {}
});

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 30000);
