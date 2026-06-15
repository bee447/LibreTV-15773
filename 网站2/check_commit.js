const WebSocket = require("ws");
const { execSync } = require("child_process");

const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773\"", {encoding:"utf8"}));
const tabId = tab.id;
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "var info = document.querySelector('[class*=latest-commit]') || document.querySelector('[class*=commit]'); info ? info.innerText.substring(0,200) : document.querySelector('.file-wrap')?.innerText?.substring(0,500) || 'No commit info'"});
  }, 5000);
  
  setTimeout(() => {
    // Get the latest commit message
    send("Runtime.evaluate", {expression: "var items = document.querySelectorAll('[class*=\\\"commit\\\"]'); Array.from(items).slice(0,3).map(i => i.textContent.trim().substring(0,100)).join(' | ')"});
  }, 7000);
  
  setTimeout(() => {
    // Check the top-right for file count
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(0,3000)"});
  }, 9000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log(val.substring(0, 2000));
    }
  } catch(e) {}
});
setTimeout(() => process.exit(0), 15000);
