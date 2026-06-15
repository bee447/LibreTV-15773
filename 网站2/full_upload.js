const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params: params || {}}));
}

// Collect all files flat (no .git, no temp files)
const siteDir = "D:\\Users\\21512\\Documents\\网站2";
const allFiles = [];

function collect(dir, relativePath) {
  for (const item of fs.readdirSync(dir)) {
    if (item === ".git" || item === "node_modules" || item.endsWith(".zip") || item.startsWith("deploy_") || item.endsWith(".js") && fs.statSync(path.join(dir, item)).isFile()) continue;
    const fullPath = path.join(dir, item);
    const relPath = relativePath ? relativePath + "/" + item : item;
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        collect(fullPath, relPath);
      } else {
        allFiles.push(fullPath);
      }
    } catch(e) {}
  }
}
collect(siteDir, "");
console.log("Files to upload: " + allFiles.length);

let step = 0;

ws.on("open", () => {
  send("Page.navigate", {url: "https://github.com/bee447/LibreTV-15773/upload/main"});
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (!msg.id || !msg.result) return;
    
    if (msg.result.root && step === 0) {
      step = 1;
      send("DOM.querySelector", {nodeId: msg.result.root.nodeId, selector: "input.manual-file-chooser"});
    }
    else if (msg.result.nodeId && step === 1) {
      step = 2;
      console.log("Uploading " + allFiles.length + " files...");
      send("DOM.setFileInputFiles", {nodeId: msg.result.nodeId, files: allFiles});
    }
    else if (step === 2) {
      step = 3;
      console.log("Files uploaded, setting commit message...");
      setTimeout(() => {
        // Find the commit message input
        send("DOM.querySelector", {nodeId: 1, selector: "input[name='commit-message']"});
      }, 5000);
    }
    else if (msg.result.nodeId && step === 3) {
      step = 4;
      // Set commit message
      send("DOM.setNodeValue", {nodeId: msg.result.nodeId, value: "fix: 首页布局修复+代理轮换+PWA优化"});
    }
    else if (step === 4) {
      step = 5;
      console.log("Looking for commit button...");
      setTimeout(() => {
        send("Runtime.evaluate", {expression: "var btn = document.querySelector('button[type=submit]'); if(btn) { btn.removeAttribute('disabled'); btn.click(); 'Committed!' } else { 'No commit button' }"});
      }, 2000);
    }
    else if (step === 5) {
      step = 6;
      const val = msg.result?.result?.value;
      console.log("Result:", val);
      if (val === "Committed!") {
        console.log("SUCCESS! Code pushed to GitHub, Netlify will auto-deploy!");
      }
      setTimeout(() => process.exit(0), 5000);
    }
  } catch(e) {
    if (step > 0) console.error("Error:", e.message);
  }
});

ws.on("error", (err) => console.error("Error:", err.message));
ws.on("close", () => { if (step < 6) console.log("Connection closed before completion"); });
setTimeout(() => process.exit(0), 30000);
