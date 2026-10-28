#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {analyze}=require('./engine.js');
if(process.argv.includes('--help')) console.log('node cli.cjs input.csv [schema.json]\nWrite a JSON quality report to stdout. Exit 0: no rejected rows; 1: rejected rows; 2: invalid input/config. Files are never modified.');
else {
  try {
    const [file,schema,...extra]=process.argv.slice(2);
    if(!file||extra.length) throw Error('Use input.csv and optional schema.json.');
    if(fs.statSync(file).size>2e6) throw Error('CSV exceeds 2 MB.');
    if(schema&&fs.statSync(schema).size>100000) throw Error('Schema exceeds 100 KB.');
    const result=analyze(fs.readFileSync(file,'utf8'),schema?JSON.parse(fs.readFileSync(schema,'utf8')):{});
    console.log(JSON.stringify(result,null,2));
    if(result.summary.rejected) process.exitCode=1;
  } catch(error) {console.error('Invalid input: '+error.message);process.exitCode=2;}
}
