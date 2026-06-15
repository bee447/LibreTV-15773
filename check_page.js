const WebSocket = require("ws");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);

let msgId = 0;

ws.on("open", () => {
  console.log("Connected!");
  
  // Check what API client is available
  send("Runtime.evaluate", {expression: "typeof window.__NEXT_DATA__ !== 'undefined' ? 'Next.js app' : typeof window.netlify !== 'undefined' ? 'Has netlify global' : 'Unknown app type'"});
  
  // Check if there's any deploy-related API on the page
  send("Runtime.evaluate", {expression: "document.querySelector('[data-testid=\"deploy-button\"]') ? 'Has deploy button' : 'No deploy button'"});
  
  // Get the page HTML structure (first 2000 chars)
  send("Runtime.evaluate", {expression: "document.body.innerHTML.substring(0, 2000)"});
  
  // Check for any API fetch interception
  send("Runtime.evaluate", {expression: "typeof __NEXT_DATA__ !== 'undefined' ? 'NEXT_DATA keys: ' + Object.keys(__NEXT_DATA__.props?.pageProps || {}).join(\",\") : 'N/A'"});
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log(val.substring(0, 800));
    }
  } catch(e) {}
});

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 10000);
