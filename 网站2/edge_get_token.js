const http = require("http");

function cdp(method, params) {
  return new Promise((resolve) => {
    const body = JSON.stringify({id:1, method, params: params || {}});
    const req = http.request({
      hostname: "127.0.0.1", port: 9222,
      path: "/devtools/page/6BE0997C229198D47C8019E763AF900D",
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
  // Check current URL
  const loc = await cdp("Runtime.evaluate", {expression: "window.location.href"});
  console.log("URL:", loc?.result?.result?.value);
  
  // Get auth token
  const token = await cdp("Runtime.evaluate", {expression: "localStorage.getItem('nf_jwt')"});
  console.log("Token:", token?.result?.result?.value?.substring(0,200));
  
  // Get all localStorage keys
  const keys = await cdp("Runtime.evaluate", {expression: "JSON.stringify(Object.keys(localStorage))"});
  console.log("Keys:", keys?.result?.result?.value);
  
  // Try to get cookies
  const cookies = await cdp("Runtime.evaluate", {expression: "document.cookie"});
  console.log("Cookies:", cookies?.result?.result?.value);
})();
