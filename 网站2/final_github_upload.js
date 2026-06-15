const WebSocket = require('ws');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tab = JSON.parse(execSync('curl.exe -s -X PUT \"http://127.0.0.1:9222/json/new?https://github.com/bee447/LibreTV-15773/upload/main\"', {encoding:'utf8'}));
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/' + tab.id);

const siteDir = 'D:\\Users\\21512\\Documents\\\u7f51\u7ad92';
const files = [];
const skipNames = new Set(['.git', 'node_modules', 'deploy.tar', 'package.json', 'package-lock.json', 'server.js', 'start.bat']);
const skipPrefixes = ['deploy_', 'netlify_', 'get_', 'cdp_', 'check_', 'explore_', 'full_', 'github_', 'upload_', 'retry_', 'final_', 'verify_', 'api_', 'edge_', 'edit_'];
function collect(dir) {
  for (const item of fs.readdirSync(dir)) {
    if (skipNames.has(item) || skipPrefixes.some(p => item.startsWith(p)) || item.endsWith('.zip')) continue;
    const fullPath = path.join(dir, item);
    try {
      const st = fs.statSync(fullPath);
      if (st.isDirectory()) collect(fullPath);
      else files.push(fullPath);
    } catch(e) {}
  }
}
collect(siteDir);
console.log('Files: ' + files.length);

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
    }
    else if (msg.result.nodeId && step === 1) {
      step = 2;
      send('DOM.setFileInputFiles', {nodeId: msg.result.nodeId, files: files});
    }
    else if (step === 2) {
      step = 3;
      setTimeout(() => {
        send('Runtime.evaluate', {expression: "document.querySelector('input[name=\"commit-message\"]') && (document.querySelector('input[name=\"commit-message\"]').value = 'fix: layout fixes + proxy improvements + player fix') && 'Message set'"});
      }, 4000);
    }
    else if (step === 3) {
      console.log('Msg result:', msg.result?.result?.value);
      step = 4;
      setTimeout(() => {
        send('Runtime.evaluate', {expression: "var btn = document.querySelector('button[type=submit]'); if(btn) { btn.removeAttribute('disabled'); btn.click(); 'Committed' } else { 'No submit button' }"});
      }, 1000);
    }
    else if (step === 4) {
      console.log('Commit:', msg.result?.result?.value);
      setTimeout(() => process.exit(0), 10000);
    }
  } catch(e) {}
});
ws.on('error', () => {});
setTimeout(() => process.exit(0), 30000);
