const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'};
http.createServer((req,res)=>{
  const clean = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, clean === '/' ? 'index.html' : clean.replace(/^\//,''));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file,(err,data)=>{ if(err){res.writeHead(404);return res.end('Not found');} res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data); });
}).listen(8802,'127.0.0.1');
