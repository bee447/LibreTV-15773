const WebSocket = require("ws");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

ws.on("open", () => {
  console.log("Connected!");
  
  // First test a simple API call
  send("Runtime.evaluate", {
    expression: `fetch("https://api.netlify.com/api/v1/sites/voluble-palmier-aada61", {credentials: "include"}).then(r => r.text()).then(t => t.substring(0,500)).catch(e => "Error: " + e.message)`,
    awaitPromise: true,
    returnByValue: true
  });
  
  setTimeout(() => {
    // If API works, do the deploy with tar
    // Read the tar file as base64 in chunks
    const tarFile = "D:\\Users\\21512\\Documents\\网站2\\deploy.tar";
    const tarContent = fs.readFileSync(tarFile);
    const base64Tar = tarContent.toString("base64");
    
    // Chunk the data - Netlify API expects the raw file
    // Use IO.read to read the file directly in the browser
    send("Runtime.evaluate", {
      expression: `
        (async () => {
          try {
            // First verify we can reach the API
            const testResp = await fetch("https://api.netlify.com/api/v1/sites/voluble-palmier-aada61", {
              credentials: "include"
            });
            const testText = await testResp.text();
            return "API accessible: " + testResp.status + " - " + testText.substring(0,200);
          } catch(e) {
            return "API test failed: " + e.message;
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    
    // Also try the same-origin approach - use /api proxy on app.netlify.com
    send("Runtime.evaluate", {
      expression: `
        (async () => {
          try {
            const resp = await fetch("/api/v1/sites/voluble-palmier-aada61");
            const text = await resp.text();
            return "Same-origin: " + resp.status + " - " + text.substring(0,200);
          } catch(e) {
            return "Same-origin failed: " + e.message;
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
  }, 2000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      console.log("=>", val);
    }
  } catch(e) {}
});

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => { console.log("Timeout"); process.exit(0); }, 30000);
