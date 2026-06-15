const http = require("http");

async function getTabs() {
  return new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
}

async function cdp(tabId, method, params) {
  return new Promise((resolve) => {
    const body = JSON.stringify({id:1, method, params: params || {}});
    const req = http.request({
      hostname: "127.0.0.1", port: 9222,
      path: "/devtools/page/" + tabId,
      method: "POST",
      headers: {"Content-Type": "application/json", "Content-Length": Buffer.byteLength(body)}
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
  const tabs = await getTabs();
  console.log("Tabs:", tabs.length);
  
  // Get existing tab or create new one
  let tab = tabs.find(t => t.url && !t.url.startsWith("chrome-extension"));
  if (!tab) tab = tabs[0];
  console.log("URL:", tab?.url);
  
  // Create a new tab for Netlify
  const newTab = await cdp(tab.id, "Target.createTarget", {url: "about:blank"});
  const newTabId = newTab?.result?.targetId;
  
  if (newTabId) {
    console.log("New tab:", newTabId);
    
    // Navigate to Netlify
    await cdp(newTabId, "Page.enable");
    await cdp(newTabId, "Page.navigate", {url: "https://app.netlify.com"});
    console.log("Navigated to app.netlify.com");
    await new Promise(r => setTimeout(r, 8000));
    
    // Check current URL
    const loc = await cdp(newTabId, "Runtime.evaluate", {expression: "window.location.href"});
    console.log("Current:", loc?.result?.result?.value);
    
    // Check if redirected to login
    const pageText = await cdp(newTabId, "Runtime.evaluate", {expression: "document.body.innerText.substring(0,500)"});
    console.log("Page:", pageText?.result?.result?.value);
    
    // Get cookies
    const cookies = await cdp(newTabId, "Runtime.evaluate", {expression: "document.cookie"});
    console.log("Cookies:", cookies?.result?.result?.value);
    
    // Check localStorage for tokens
    const ls = await cdp(newTabId, "Runtime.evaluate", {expression: "(()=>{let r={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);r[k]=localStorage.getItem(k).substring(0,100)}return JSON.stringify(r)})()"});
    console.log("localStorage:", ls?.result?.result?.value);
  }
})();
