const WebSocket = require("ws");
const { execSync } = require("child_process");

const tab = JSON.parse(execSync('curl.exe -s -X PUT "http://127.0.0.1:9222/json/new?https://app.netlify.com/projects/voluble-palmier-aada61/deploys"', {encoding:"utf8"}));
const tabId = tab.id;

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  setTimeout(() => {
    // Check for recent deploys - look for any deploy in progress
    send("Runtime.evaluate", {expression: "var deploys = document.querySelectorAll('[class*=deploy-item], [class*=deployRow], [class*=deploy-card]'); deploys.length + ' deploy items found'"});
  }, 5000);
  
  setTimeout(() => {
    // Get deploy list text
    send("Runtime.evaluate", {expression: "var els = document.querySelectorAll('[class*=deploy]'); Array.from(els).slice(0,5).map(e => e.textContent.trim().substring(0,100)).join('\\n')"});
  }, 7000);
  
  setTimeout(() => {
    // Check if any deployment is running
    send("Runtime.evaluate", {expression: "document.body.innerText.includes('Building') || document.body.innerText.includes('Enqueued') || document.body.innerText.includes('Deploying') ? 'Deploy in progress' : 'No deploy detected'"});
  }, 9000);
  
  setTimeout(() => {
    // Try clicking Trigger deploy again - more carefully
    send("Runtime.evaluate", {expression: "var btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Trigger')); if(btn) { btn.click(); setTimeout(function(){ var items = document.querySelectorAll('[role=menuitem]'); for(var i=0;i<items.length;i++){ if(items[i].textContent.trim() === 'Deploy project'){ items[i].click(); break; }}},500); 'Triggered' } else { 'No trigger button' }"});
  }, 11000);
  
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "document.body.innerText.includes('Building') || document.body.innerText.includes('Enqueued') ? 'Deploy ENQUEUED!' : 'Status check done'"});
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

setTimeout(() => process.exit(0), 30000);
