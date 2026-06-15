const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
let pending = {};

function send(method, params) {
  msgId++;
  pending[msgId] = method;
  ws.send(JSON.stringify({id: msgId, method, params: params || {}}));
}

ws.on("open", () => {
  // Navigate to GitHub upload page
  send("Page.navigate", {url: "https://github.com/bee447/LibreTV-15773/upload/main"});
  
  setTimeout(() => {
    // Find the file input element via CDP
    send("DOM.getDocument");
  }, 6000);
});

// Collect all files
const siteDir = "D:\\Users\\21512\\Documents\\网站2";
const filesToUpload = [];
function collectFiles(dir) {
  for (const item of fs.readdirSync(dir)) {
    if (item === ".git" || item === "node_modules" || item === "deploy.tar" || item.endsWith(".zip") || item.startsWith("deploy_") || item.endsWith(".js") && item !== "player.js") continue;
    const fullPath = path.join(dir, item);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        collectFiles(fullPath);
      } else {
        filesToUpload.push(fullPath);
      }
    } catch(e) {}
  }
}
collectFiles(siteDir);
console.log("Files to upload:", filesToUpload.length);

let step = 0;
let nodeId = null;

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id && msg.result) {
      const r = msg.result;
      
      if (r.root && step === 0) {
        // Got document, search for file input
        step = 1;
        send("DOM.querySelector", {nodeId: r.root.nodeId, selector: "input.manual-file-chooser"});
      }
      else if (r.nodeId && step === 1) {
        nodeId = r.nodeId;
        console.log("Found file input, nodeId:", nodeId);
        
        // Set files on the input
        step = 2;
        const filePaths = filesToUpload.slice(0, 5); // Start with 5 files
        send("DOM.setFileInputFiles", {nodeId, files: filePaths});
      }
      else if (step === 2) {
        console.log("Files set result:", JSON.stringify(r).substring(0, 100));
        step = 3;
        // Check upload progress
        setTimeout(() => {
          send("Runtime.evaluate", {expression: "document.querySelector('.upload-files-container')?.innerText?.substring(0,500) || document.body.innerText.substring(1500,3000)"});
        }, 2000);
      }
      else if (step === 3) {
        console.log("Page state:", r?.result?.value?.substring(0, 500));
      }
    }
  } catch(e) {
    console.error("Parse error:", e.message);
  }
});

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 20000);
