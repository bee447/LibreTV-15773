const WebSocket = require("ws");
const { execSync } = require("child_process");
const fs = require("fs");

const fixedIndex = fs.readFileSync("D:\\Users\\21512\\Documents\\网站2\\index.html", "utf8");

const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773/edit/main/index.html\"", {encoding:"utf8"}));
const tabId = tab.id;

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  setTimeout(() => {
    // Focus the editor
    send("Runtime.evaluate", {expression: "var el = document.querySelector('.cm-content'); if(el) { el.focus(); 'focused' } else { 'not found' }"});
  }, 6000);
  
  setTimeout(() => {
    // Select all and delete (Ctrl+A, then Delete)
    send("Input.dispatchKeyEvent", {type: "rawKeyDown", windowsVirtualKeyCode: 65, modifiers: 8});  // Ctrl+A
    send("Input.dispatchKeyEvent", {type: "rawKeyDown", windowsVirtualKeyCode: 46, modifiers: 0});  // Delete
  }, 8000);
  
  setTimeout(() => {
    // Insert the new content using insertText
    // Split into chunks for reliability
    send("Runtime.evaluate", {expression: "(function(){var ta = document.createElement('textarea'); ta.value = arguments[0]; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand('insertText', false, arguments[0]); document.body.removeChild(ta); return 'inserted'})('" + fixedIndex.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "") + "')"});
  }, 11000);
  
  setTimeout(() => {
    // Check if content was inserted
    send("Runtime.evaluate", {expression: "var el = document.querySelector('.cm-content'); el.textContent.substring(0, 100)"});
  }, 15000);
  
  setTimeout(() => {
    // Find and click the Commit changes button
    send("Runtime.evaluate", {expression: "(function(){var b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Commit changes')); if(b) { b.click(); return 'Committed' } return 'Not found' })()"});
  }, 18000);
  
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "window.location.href"});
    process.exit(0);
  }, 25000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log(val.substring(0, 500));
    }
  } catch(e) {}
});
setTimeout(() => process.exit(0), 30000);
