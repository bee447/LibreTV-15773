const WebSocket = require("ws");
const tabId = "6BE0997C229198D47C8019E763AF900D";
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;

function send(method, params) {
  msgId++;
  ws.send(JSON.stringify({id: msgId, method, params}));
}

ws.on("open", () => {
  // Navigate to upload page
  send("Page.navigate", {url: "https://github.com/bee447/LibreTV-15773/upload/main"});
  
  setTimeout(async () => {
    // Get the file input node
    send("DOM.getDocument");
  }, 5000);
});

let step = 0, btnNodeId = null;

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (!msg.id || !msg.result) return;
    const r = msg.result;
    
    if (r.root && step === 0) {
      step = 1;
      send("DOM.querySelector", {nodeId: r.root.nodeId, selector: ".manual-file-chooser"});
    }
    else if (r.nodeId && step === 1) {
      step = 2;
      console.log("File input node:", r.nodeId);
      // Set index.html file
      const files = ["D:\\Users\\21512\\Documents\\网站2\\index.html"];
      send("DOM.setFileInputFiles", {nodeId: r.nodeId, files});
    }
    else if (step === 2) {
      step = 3;
      console.log("Set files result:", JSON.stringify(r));
      // Wait and check page
      setTimeout(() => {
        send("Runtime.evaluate", {expression: "document.querySelector('#repo-content-turbo-frame') ? document.querySelector('#repo-content-turbo-frame').innerText.substring(0,2000) : document.body.innerText.substring(0,3000)"});
      }, 5000);
    }
    else if (step === 3) {
      step = 4;
      const val = r?.result?.value;
      console.log("Page content:", val?.substring(0, 1000));
      
      // Check for file list
      setTimeout(() => {
        send("Runtime.evaluate", {expression: "document.querySelectorAll('.tree-result-item, [class*=file-info], [class*=upload-file]').length + ' files visible'"});
      }, 2000);
    }
    else if (step === 4) {
      console.log("File count:", r?.result?.value);
      
      // Check commit button
      send("Runtime.evaluate", {expression: "document.querySelector('button[type=submit]').textContent"});
    }
    else if (step === 5) {
      console.log("Submit button:", r?.result?.value);
      process.exit(0);
    }
  } catch(e) { console.error("Error:", e.message); }
});

ws.on("error", (err) => console.error("Error:", err.message));
setTimeout(() => process.exit(0), 30000);
