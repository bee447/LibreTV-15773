const WebSocket = require("ws");
const { execSync } = require("child_process");
const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773\"", {encoding:"utf8"}));
const tabId = tab.id;
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }
ws.on("open", () => {
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "var el = document.querySelector('[class*=latest-commit] span, .commit-author, [class*=commit] a'); el ? el.textContent.trim() : 'checking...'"});
  }, 4000);
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "document.querySelector('[class*=file-info]')?.innerText?.substring(0,200) || document.querySelector('[class*=commit-tease]')?.innerText?.substring(0,300) || document.querySelector('.file-wrap')?.innerText?.substring(0,500) || document.body.innerText.substring(0,1000)"});
  }, 6000);
  setTimeout(() => process.exit(0), 10000);
});
ws.on("message", (data) => {
  try { const msg = JSON.parse(data.toString()); if (msg.id) { const val = msg.result?.result?.value; if (val) console.log(val); } } catch(e) {}
});
setTimeout(() => process.exit(0), 15000);
