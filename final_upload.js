const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

// Get a fresh tab
const tabs = JSON.parse(require("child_process").execSync('curl.exe -s http://127.0.0.1:9222/json', {encoding: "utf8"}));
const tab = JSON.parse(require("child_process").execSync('curl.exe -s -X PUT "http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773/upload/main"', {encoding: "utf8"}));
const tabId = tab.id;
console.log("Tab:", tabId);

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

// Collect files - INCLUDE everything needed
const siteDir = "D:\\Users\\21512\\Documents\\网站2";
const allFiles = [];
function collect(dir) {
  let list;
  try { list = fs.readdirSync(dir); } catch(e) { return; }
  for (const item of list) {
    if (item === ".git" || item === "node_modules" || item.endsWith(".zip")) continue;
    if (item.startsWith("deploy_") || item.startsWith("netlify_") || item === "get_cookies.js" || item === "cdp_") continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) collect(fullPath);
    else allFiles.push(fullPath);
  }
}
collect(siteDir);
console.log("Files:", allFiles.length);

allFiles.forEach(f => console.log("  ", path.relative(siteDir, f)));

let step = 0, rootNodeId = null;

ws.on("open", () => setTimeout(() => send("DOM.getDocument"), 2000));

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (!msg.id || !msg.result) return;
    
    if (msg.result.root && step === 0) {
      rootNodeId = msg.result.root.nodeId;
      step = 1;
      send("DOM.querySelector", {nodeId: rootNodeId, selector: "input.manual-file-chooser"});
    }
    else if (msg.result.nodeId && step === 1) {
      step = 2;
      send("DOM.setFileInputFiles", {nodeId: msg.result.nodeId, files: allFiles});
    }
    else if (step === 2) {
      step = 3;
      console.log("Files uploaded! Waiting for processing...");
      setTimeout(() => send("Runtime.evaluate", {expression: "document.querySelector('[name=\"commit-message\"]').value = 'fix: layout fixes + proxy fallback + player fix'; true"}), 3000);
    }
    else if (step === 3) {
      step = 4;
      setTimeout(() => {
        send("Runtime.evaluate", {expression: "(function(){var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.trim()==='Commit changes');if(b){b.click();return'SUCCESS'}return'No commit button'})()"});
      }, 1000);
    }
    else if (step === 4) {
      step = 5;
      console.log("Result:", msg.result?.result?.value);
      if (msg.result?.result?.value === "SUCCESS") console.log("COMMIT SUBMITTED! Netlify will auto-deploy!");
      setTimeout(() => process.exit(0), 10000);
    }
  } catch(e) { if (step > 0) console.error("Error:", e.message); }
});

ws.on("error", (err) => { if (step < 5) console.error("WS Error:", err.message); });
setTimeout(() => { console.log("Timeout"); process.exit(1); }, 40000);
