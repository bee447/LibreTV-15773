const http = require("http");

function cdp(method, params, tabId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({id:1, method, params: params || {}});
    const path = tabId ? "/devtools/page/" + tabId : "/devtools/browser/" + crypto.randomUUID();
    const req = http.request({
      hostname: "127.0.0.1", port: 9222,
      path: path,
      method: "POST",
      headers: {"Content-Type": "application/json"}
    }, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.write(body);
    req.end();
  });
}

(async () => {
  // Get tabs
  const tabs = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
  
  console.log("Tabs:", tabs.length);
  
  // Create a new tab
  const { execSync } = require("child_process");
  const result = execSync('curl.exe -s -X PUT "http://127.0.0.1:9222/json/new?https://app.netlify.com/sites/voluble-palmier-aada61/deploys"', {encoding: "utf8"});
  const newTab = JSON.parse(result);
  console.log("New tab:", newTab.id, newTab.url);
  
  // Wait for page to load
  await new Promise(r => setTimeout(r, 8000));
  
  // Get page content
  const body = await cdp("Runtime.evaluate", {expression: "document.body?.innerText?.substring(0,1000)"}, newTab.id);
  console.log("Page content:", body?.result?.result?.value);
  
  // Get cookies
  const cookies = await cdp("Runtime.evaluate", {expression: "document.cookie"}, newTab.id);
  console.log("Cookies:", cookies?.result?.result?.value);
  
  // Get localStorage
  const ls = await cdp("Runtime.evaluate", {expression: "(function(){var r={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);r[k]=localStorage.getItem(k).substring(0,200)}return JSON.stringify(r)})()"}, newTab.id);
  console.log("localStorage:", ls?.result?.result?.value);
  
  // Check if we're on login page or dashboard
  const url = await cdp("Runtime.evaluate", {expression: "window.location.href"}, newTab.id);
  console.log("URL:", url?.result?.result?.value);
  
  // Try to get auth from the page's fetch/XHR calls
  // Inject JS to intercept API responses
})();
