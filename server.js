 // LibreTV 本地服务器 - 简洁稳定版
 var h=require('http'),hs=require('https'),f=require('fs'),p=require('path'),u=require('url');
 var PORT=3000;
 var MIME={
   '.html':'text/html;charset=utf-8',
   '.js':'text/javascript;charset=utf-8',
   '.css':'text/css',
   '.json':'application/json',
   '.svg':'image/svg+xml'
 };
 
 function proxy(target, res) {
   var decoded = decodeURIComponent(target);
   console.log('[P]', decoded.substring(0, 80));
   var parsed = u.parse(decoded);
   var lib = parsed.protocol === 'https:' ? hs : h;
   var opt = {
     hostname: parsed.hostname,
     port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
     path: parsed.path + (parsed.search || ''),
     method: 'GET',
     headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
     rejectUnauthorized: false
   };
   var req = lib.request(opt, function(pr) {
     if (pr.statusCode >= 300 && pr.statusCode < 400 && pr.headers.location) {
       var loc = pr.headers.location;
       if (!loc.startsWith('http')) loc = parsed.protocol+'//'+parsed.host+loc;
       console.log('[R]', pr.statusCode, '->', loc.substring(0, 60));
       proxy(encodeURIComponent(loc), res);
       return;
     }
     var ct = pr.headers['content-type'] || 'application/octet-stream';
     res.writeHead(pr.statusCode, { 'Access-Control-Allow-Origin':'*', 'Content-Type':ct });
     pr.pipe(res);
     pr.on('error', function() { try { res.end(); } catch(e) {} });
     res.on('error', function() { try { req.destroy(); } catch(e) {} });
     });
     req.on('error', function(e) {
     try { res.writeHead(502, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
     res.end(JSON.stringify({code:502,msg:e.message,list:[]})); } catch(ex) {}
   });
   req.setTimeout(20000, function() { req.destroy(); try { res.writeHead(504); res.end('Timeout'); } catch(e) {} });
   req.end();
 }
 
 var srv = h.createServer(function(req, res) {
   try {
     var pu = u.parse(req.url);
     var rp = pu.pathname;
     if (rp.startsWith('/proxy/')) { proxy(rp.substring(7), res); return; }
     if (rp === '/') rp = '/index.html';
     var fp = p.join('.', rp);
     f.readFile(fp, function(e, d) {
       if (e) { res.writeHead(404); res.end('Not Found'); return; }
       var ct = MIME[p.extname(fp).toLowerCase()] || 'text/plain';
       res.writeHead(200, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' });
       res.end(d);
     });
   } catch(e) { try { res.writeHead(500); res.end('Error'); } catch(ex) {} }
 });
 
 srv.on('error', function(e) { console.error('[SRV]', e.message); });
 
 srv.listen(PORT, function() {
   console.log('==================================');
   console.log('  LibreTV Server Started');
   console.log('  http://localhost:' + PORT);
   console.log('  /proxy/ enabled (timeout: 20s)');
   console.log('==================================');
 });
