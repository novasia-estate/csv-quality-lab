'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const sample=fs.readFileSync('examples/listings.csv','utf8'),schema=JSON.parse(fs.readFileSync('examples/schema.json','utf8'));
const script=(fs.readFileSync('engine.js','utf8')+'\nconst EXAMPLE_CSV='+JSON.stringify(sample)+';\nconst EXAMPLE_SCHEMA='+JSON.stringify(schema)+';\n'+fs.readFileSync('app.js','utf8')).replace(/\r\n?/g,'\n');
if(/<\/script/i.test(script))throw Error('Unsafe embedded script terminator');
const hash=crypto.createHash('sha256').update(script).digest('base64');
const html=fs.readFileSync('template.html','utf8').replace(/\r\n?/g,'\n').replace('{{HASH}}',hash).replace('{{SCRIPT}}',()=>script);
fs.writeFileSync('index.html',html);console.log('Built one self-contained app; CSP binds the exact script hash.');
