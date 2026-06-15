const WebSocket = require("ws");
const { execSync } = require("child_process");
const fs = require("fs");

const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773\"", {encoding:"utf8"}));
const tabId = tab.id;
const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  // Go to the index.html page and click edit
  send("Page.navigate", {url: "https://github.com/bee447/LibreTV-15773/blob/main/index.html"});
  
  setTimeout(() => {
    // Click the edit (pencil) button
    send("Runtime.evaluate", {expression: "(function(){var btn = document.querySelector('[aria-label=\\\"Edit file\\\"]')||document.querySelector('[data-testid=\\\"edit-button\\\"]')||document.querySelector('[href*=\\\"/edit/\\\"]'); if(btn) { btn.click(); return \"Clicked edit\" } return \"No edit button\" })()"});
  }, 5000);
  
  setTimeout(() => {
    send("Runtime.evaluate", {expression: "window.location.href"});
  }, 8000);
  
  setTimeout(() => {
    // We should be on the edit page now. Replace content.
    // For Monaco editor (new GitHub), find the editor and set content
    send("Runtime.evaluate", {expression: "var editor = document.querySelector('.monaco-editor'); if(editor) { 'Monaco found' } else { document.querySelector('.cm-editor') ? 'CM found' : 'No editor: ' + window.location.href }"});
  }, 12000);
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.id) {
      const val = msg.result?.result?.value;
      if (val) console.log(val.substring(0, 500));
    }
  } catch(e) {}
});
setTimeout(() => process.exit(0), 25000);
