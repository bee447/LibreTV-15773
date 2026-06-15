const WebSocket = require("ws");
const { execSync } = require("child_process");

const newTab = JSON.parse(execSync('curl.exe -s -X PUT "http://127.0.0.1:9222/json/new?https://app.netlify.com/projects/voluble-palmier-aada61/deploys"', {encoding: "utf8"}));
const tabId = newTab.id;
console.log("Tab:", tabId);

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

let step = 0;

ws.on("open", () => {
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(0,500)"});
  }, 5000);
  
  setTimeout(() => {
    // Check for GitHub deploy notification
    send("Runtime.evaluate", {expression: "Array.from(document.querySelectorAll('[class*=deploy]')).map(e => e.textContent.trim()).filter(t => t.length > 3).slice(0,10)"});
  }, 7000);
  
  setTimeout(() => {
    // Click Trigger deploy button
    send("Runtime.evaluate", {expression: "(function(){var b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent.includes('Trigger'));if(b){b.click();return'Clicked'}return'Not found'})()"});
  }, 9000);
  
  setTimeout(() => {
    // Check dropdown
    send("Runtime.evaluate", {expression: "Array.from(document.querySelectorAll('[role=menuitem], [class*=menu]')).map(e => e.textContent.trim()).join(' | ')"});
  }, 11000);
  
  setTimeout(() => {
    // Click "Deploy project"
    send("Runtime.evaluate", {expression: "(function(){var items=document.querySelectorAll('[role=menuitem]');for(var i=0;i<items.length;i++){if(items[i].textContent.includes('Deploy project')&&!items[i].textContent.includes('without')){items[i].click();return'Deploying'}return'Not found'})(),false}"});
  }, 13000);
  
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(500,2000)"});
  }, 20000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val && typeof val === "string") console.log(val.substring(0, 500));
      else if (val) console.log(JSON.stringify(val).substring(0, 500));
    }
  } catch(e) {}
});

setTimeout(() => process.exit(0), 30000);
