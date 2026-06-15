const WebSocket = require("ws");
const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("open", () => {
  // Navigate to the deploy page
  send("Page.navigate", {url: "https://app.netlify.com/projects/voluble-palmier-aada61/deploys"});
  
  setTimeout(() => {
    // Get page title
    send("Runtime.evaluate", {expression: "document.title"});
    
    // Get current URL  
    send("Runtime.evaluate", {expression: "window.location.href"});
    
    // Get visible text (first 2000 chars)
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(0, 3000)"});
  }, 8000);
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

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 20000);
