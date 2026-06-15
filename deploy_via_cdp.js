const WebSocket = require("ws");
const fs = require("fs");

const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);

let msgId = 0;
const pending = {};

ws.on("open", () => {
  console.log("Connected to page!");
  
  // 1. First, read the tar file and prepare it for upload
  const tarFile = "D:\\Users\\21512\\Documents\\网站2\\deploy.tar";
  if (!fs.existsSync(tarFile)) {
    console.error("Tar file not found!");
    return;
  }
  const tarContent = fs.readFileSync(tarFile);
  const base64Tar = tarContent.toString("base64");
  console.log("Tar size: " + tarContent.length + " bytes, base64: " + base64Tar.length + " chars");
  
  // 2. Use CDP to make the API call from the page context
  // This sends the cookies automatically
  const jsCode = `
    (async () => {
      try {
        // Decode the base64 tar data
        const binaryStr = atob("${base64Tar}");
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        
        // Create the deploy via Netlify API
        const response = await fetch("https://api.netlify.com/api/v1/sites/voluble-palmier-aada61/deploys", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-tar"
          },
          credentials: "include",
          body: bytes
        });
        
        const result = await response.text();
        return JSON.stringify({status: response.status, result: result.substring(0, 500)});
      } catch(e) {
        return "ERROR: " + e.message;
      }
    })()
  `;
  
  // Send the command
  send("Runtime.evaluate", {
    expression: jsCode,
    awaitPromise: true,
    returnByValue: true
  });
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const value = msg.result?.result?.value;
      console.log("Result:", value);
      process.exit(0);
    }
  } catch(e) {}
});

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(1), 30000);
