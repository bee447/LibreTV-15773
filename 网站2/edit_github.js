const WebSocket = require("ws");
const { execSync } = require("child_process");
const fs = require("fs");

// Read the fixed index.html
const fixedIndex = fs.readFileSync("D:\\Users\\21512\\Documents\\网站2\\index.html", "utf8");
console.log("Fixed index.html: " + fixedIndex.length + " chars");

// Navigate to GitHub editor
const tab = JSON.parse(execSync("curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773/edit/main/index.html\"", {encoding:"utf8"}));
const tabId = tab.id;

const ws = new WebSocket("ws://127.0.0.1:9222/devtools/page/" + tabId);
let msgId = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on("open", () => {
  setTimeout(() => {
    // Navigate again in case
    send("Page.navigate", {url: "https://github.com/bee447/LibreTV-15773/edit/main/index.html"});
  }, 1000);
  
  setTimeout(() => {
    // Check for the code editor
    send("Runtime.evaluate", {expression: "document.querySelector('[role=textbox], .CodeMirror, textarea, .cm-editor, .monaco-editor') ? 'Editor found' : document.querySelectorAll('textarea').length + ' textareas'"});
  }, 8000);
  
  setTimeout(() => {
    // Find the editor and replace content
    send("Runtime.evaluate", {expression: "document.querySelectorAll('textarea').length + ' textarea: ' + Array.from(document.querySelectorAll('textarea')).map(t => t.name || t.className.substring(0,30)).join(', ')"});
  }, 10000);
  
  setTimeout(() => {
    // Try to find the actual code editor
    send("Runtime.evaluate", {expression: "var cm = document.querySelector('.cm-content'); if(cm) { cm.focus(); 'Found cm-content' } else { var ta = document.querySelector('textarea'); if(ta) { ta.style.display = 'block'; ta.focus(); 'Made textarea visible' } else { 'No editor found' }}"});
  }, 12000);
  
  setTimeout(() => {
    // Use CDP to set the editor content via Input method
    // First try to find the right element
    send("Runtime.evaluate", {expression: "var editor = document.querySelector('.cm-editor'); var content = editor ? editor.querySelector('.cm-content') : null; if(content) { content.innerText = ''; 'Found editor' } else { document.querySelector('textarea') ? 'Have textarea' : 'No editor' }"});
  }, 14000);
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
