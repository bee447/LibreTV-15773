const WebSocket = require("ws");
const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("open", () => {
  // Navigate to deploys page
  send("Page.navigate", {url: "https://app.netlify.com/projects/voluble-palmier-aada61/deploys"});
  
  setTimeout(() => {
    // Check for deploy button and its attributes
    send("Runtime.evaluate", {expression: "document.querySelector('[data-testid=\"deploy-button\"], button:contains(\"Trigger deploy\"), [class*=\"trigger\"], [class*=\"deploy-button\"]') ? 'found' : 'searching different selectors'"});
    
    // Find all buttons with "Deploy" or "Trigger"
    send("Runtime.evaluate", {expression: "Array.from(document.querySelectorAll(\"button\")).filter(b => b.textContent.includes(\"Trigger\") || b.textContent.includes(\"Deploy\") || b.textContent.includes(\"deploy\")).map(b => ({text: b.textContent, id: b.id, class: b.className.substring(0,80)})).length + ' buttons found'"});
  }, 5000);
  
  setTimeout(() => {
    // Get deploy buttons details
    send("Runtime.evaluate", {expression: "JSON.stringify(Array.from(document.querySelectorAll(\"button\")).filter(b => b.textContent.includes(\"Trigger\") || b.textContent.includes(\"Deploy\")).map(b => ({text: b.textContent.trim(), id: b.id, testid: b.getAttribute(\"data-testid\"), class: (b.className || '').substring(0,100)})))"});
  }, 8000);
  
  setTimeout(() => {
    // Try clicking the Trigger deploy button
    send("Runtime.evaluate", {expression: "(function(){var btn=document.querySelector(\"button\");Array.from(document.querySelectorAll(\"button\")).forEach(function(b){if(b.textContent.includes(\"Trigger\")){console.log('Found trigger button');b.click();return;}});return 'clicked';})()"});
  }, 10000);
  
  setTimeout(() => {
    // See what appeared after clicking
    send("Runtime.evaluate", {expression: "document.body.innerText.substring(1500, 4000)"});
  }, 13000);
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
setTimeout(() => process.exit(0), 25000);
