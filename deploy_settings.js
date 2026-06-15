const WebSocket = require("ws");
const { execSync } = require("child_process");

const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://app.netlify.com/projects/voluble-palmier-aada61/deploys\"", {encoding:"utf8"}));
const tabId = tab.id;

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  setTimeout(() => {
    // Click "Deploy settings"
    send("Runtime.evaluate", {expression: "(function(){var links=document.querySelectorAll('a');for(var i=0;i<links.length;i++){if(links[i].textContent.trim()==='Deploy settings'){return links[i].href}}return'Not found'})()"});
  }, 5000);
  
  setTimeout(() => {
    // Navigate to deploy settings URL directly
    send("Page.navigate", {url: "https://app.netlify.com/projects/voluble-palmier-aada61/settings/deploy"});
  }, 8000);
  
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "window.location.href"});
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(0,3000)"});
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
setTimeout(() => process.exit(0), 25000);
