const WebSocket = require('ws');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tab = JSON.parse(execSync('curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773/upload/main\"', {encoding:'utf8'}));
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/' + tab.id);

const baseDir = 'D:\\Users\\21512\\Documents\\' + String.fromCharCode(32593, 31449, 50);
const files = [];
const skip = new Set(['.git','node_modules','deploy.tar','package.json','package-lock.json','server.js','start.bat']);

for (const item of fs.readdirSync(baseDir)) {
  if (skip.has(item) || item.endsWith('.zip')) continue;
  const fp = path.join(baseDir, item);
  try {
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      for (const sub of fs.readdirSync(fp)) {
        files.push(path.join(fp, sub));
      }
    } else {
      files.push(fp);
    }
  } catch(e) {}
}
console.log('Uploading ' + files.length + ' files');

let msgId = 0, step = 0;
function send(m, p) { msgId++; ws.send(JSON.stringify({id:msgId, method:m, params:p||{}})); }

ws.on('open', () => setTimeout(() => send('DOM.getDocument'), 3000));
ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (!msg.id || !msg.result) return;
    if (msg.result.root && step === 0) {
      step = 1;
      send('DOM.querySelector', {nodeId: msg.result.root.nodeId, selector: 'input.manual-file-chooser'});
    } else if (msg.result.nodeId && step === 1) {
      step = 2;
      send('DOM.setFileInputFiles', {nodeId: msg.result.nodeId, files: files});
    } else if (step === 2) {
      step = 3;
      setTimeout(() => send('Runtime.evaluate', {expression: "document.querySelector('input[name=commit-message]') && (document.querySelector('input[name=commit-message]').value='fix: layout+proxy+player');true"}), 4000);
    } else if (step === 3) {
      step = 4;
      setTimeout(() => send('Runtime.evaluate', {expression: "var b=document.querySelector('button[type=submit]');if(b){b.click();'Committed!'}else{'No btn'}"}), 1000);
    } else if (step === 4) {
      console.log(msg.result?.result?.value);
      setTimeout(() => process.exit(0), 5000);
    }
  } catch(e) {}
});
ws.on('error', () => {});
setTimeout(() => process.exit(0), 30000);
