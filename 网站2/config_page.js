const WebSocket = require("ws");
const { execSync } = require("child_process");

const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://app.netlify.com/projects/voluble-palmier-aada61/configuration/deploys\"", {encoding:"utf8"}));
const tabId = tab.id;

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "window.location.href + '\\n' + document.body.innerText.substring(0,3000)"});
  }, 6000);
  
  setTimeout(() => {
    // Look for disconnect/remove buttons
    send("Runtime.evaluate", {expression: "Array.from(document.querySelectorAll('button,a,span,label')).filter(e => e.textContent.toLowerCase().includes('disconnect')||e.textContent.toLowerCase().includes('remove')||e.textContent.toLowerCase().includes('delete')||e.textContent.toLowerCase().includes('git')).map(e => e.textContent.trim().substring(0,50)).join('| ')"});
  }, 10000);
  
  setTimeout(() => {
    // Look for any form/input for connecting to git
    send("Runtime.evaluate", {expression: "Array.from(document.querySelectorAll('a')).map(a => a.textContent.trim()+'|'+a.href).filter(x => x.includes('github')||x.includes('git')||x.includes('deploy')).join('\\n')"});
  }, 12000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log(val.substring(0, 3000));
    }
  } catch(e) {}
});
setTimeout(() => process.exit(0), 20000);
