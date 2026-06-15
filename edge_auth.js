const http = require("http");

function cdp(tabId, method, params) {
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
  const tabs = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
  
  console.log("Tabs:", tabs.length);
  let tab = tabs.find(t => t.url && !t.url.startsWith("chrome-") && !t.url.startsWith("about:"));
  if (!tab) tab = tabs[0];
  console.log("Using tab:", tab.url);
  
  // Create new tab for Netlify
  const newTabResp = await new Promise((resolve) => {
    http.get("http://127.0.0.1:9222/json/new?https://app.netlify.com", (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    }).on("error", resolve);
  });
  console.log("New tab ID:", newTabResp.id);
  
  await new Promise(r => setTimeout(r, 6000));
  
  // Check URL to see if logged in
  const loc = await cdp(newTabResp.id, "Runtime.evaluate", {expression: "window.location.href"});
  console.log("URL:", loc?.result?.result?.value);
  
  // Get auth info from localStorage
  const nfJwt = await cdp(newTabResp.id, "Runtime.evaluate", {expression: "localStorage.getItem('nf_jwt')?.substring(0,300)"});
  console.log("nf_jwt:", nfJwt?.result?.result?.value);
  
  const accessToken = await cdp(newTabResp.id, "Runtime.evaluate", {expression: "localStorage.getItem('access_token')?.substring(0,300)"});
  console.log("access_token:", accessToken?.result?.result?.value);
  
  // Check other keys
  const allKeys = await cdp(newTabResp.id, "Runtime.evaluate", {expression: "JSON.stringify(localStorage.length > 20 ? 'many: ' + localStorage.length : Object.keys(localStorage))"});
  console.log("LS keys:", allKeys?.result?.result?.value);
  
  if (nfJwt?.result?.result?.value) {
    console.log("GOT NETLIFY TOKEN!");
  }
})();
