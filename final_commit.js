const WebSocket = require("ws");
const { execSync } = require("child_process");
const fs = require("fs");

const fixedIndex = fs.readFileSync("D:\\Users\\21512\\Documents\\网站2\\index.html", "utf8");

const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773/edit/main/index.html\"", {encoding:"utf8"}));
const tabId = tab.id;
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
let step = 0;

function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  // Wait for page load
  setTimeout(() => {
    console.log("Setting editor content...");
    // Try to access the CM editor directly
    send("Runtime.evaluate", {expression: "var el = document.querySelector('.cm-content'); if(!el) return 'no cm-content'; const content = `" + fixedIndex.replace(/`/g, "\\`") + "`; el.focus(); if(document.execCommand('selectAll')){}; document.execCommand('insertText', false, content); 'Content set: ' + el.textContent.length + ' chars'"});
  }, 6000);
  
  setTimeout(() => {
    console.log("Checking content...");
    send("Runtime.evaluate", {expression: "var el = document.querySelector('.cm-content'); el.textContent.substring(0, 50)"});
  }, 10000);
  
  setTimeout(() => {
    console.log("Committing...");
    // Click the Propose changes / Commit changes button
    send("Runtime.evaluate", {expression: "(function(){var b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim().includes('Commit changes')); if(b) { b.click(); return 'Clicked commit button' } return 'No commit button: ' + Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).join(' | ') })()"});
  }, 14000);
  
  setTimeout(() => {
    console.log("Checking URL...");
    send("Runtime.evaluate", {expression: "window.location.href"});
    process.exit(0);
  }, 20000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log(val);
    }
  } catch(e) {}
});

ws.on("error", (err) => console.error("WS Error:", err.message));
setTimeout(() => process.exit(0), 30000);
