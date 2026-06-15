const WebSocket = require("ws");
const { execSync } = require("child_process");

const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://app.netlify.com/projects/voluble-palmier-aada61/settings/deploys\"", {encoding:"utf8"}));
const tabId = tab.id;

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(0, 4000)"});
  }, 6000);
  
  setTimeout(() => {
    // Look for disconnect/remove git option
    send("Runtime.evaluate", {expression: "Array.from(document.querySelectorAll('button,a,span')).filter(e => e.textContent.includes('disconnect')||e.textContent.includes('Disconnect')||e.textContent.includes('Remove')||e.textContent.includes('Git')).map(e => e.textContent.trim()+'|'+e.tagName).join('\\n')"});
  }, 10000);
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
