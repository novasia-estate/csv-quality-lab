(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CSVQuality=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
  function parseCSV(text, delimiter = 'auto') {
    text = String(text).replace(/^\uFEFF/, '');
    if (text.length > 2e6) throw Error('Limit this browser tool to 2 MB of CSV text.');
    if (!text.trim()) throw Error('Paste CSV with a header row.');
    if (delimiter === 'auto') {
      const counts = { ',': 0, ';': 0, '\t': 0 }; let quoted = false;
      for (let i = 0; i < text.length && !(!quoted && /[\r\n]/.test(text[i])); i++) {
        if (text[i] === '"') { if (quoted && text[i + 1] === '"') i++; else quoted = !quoted; }
        else if (!quoted && text[i] in counts) counts[text[i]]++;
      }
      delimiter = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    }
    if (![',', ';', '\t'].includes(delimiter)) throw Error('Use comma, semicolon or tab.');
    const rows = []; let row = [], cell = '', quoted = false, closed = false;
    const endCell = () => { row.push(cell); cell = ''; closed = false; if (row.length > 200) throw Error('Limit CSV to 200 columns.'); };
    const endRow = () => { endCell(); rows.push(row); row = []; if (rows.length > 10001) throw Error('Limit CSV to 10,000 data rows.'); };
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) { if (char === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += char; }
      else if (char === delimiter) endCell();
      else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; endRow(); }
      else if (char === '"') { if (cell || closed) throw Error('Invalid CSV quote. Quote the whole field and escape inner quotes as double quotes.'); quoted = true; }
      else { if (closed) throw Error('Unexpected text after a closing CSV quote.'); cell += char; }
    }
    if (quoted) throw Error('CSV has an unclosed quoted field.');
    if (cell || closed || row.length) endRow();
    return { rows, delimiter };
  }
  function safeCell(value) { value = String(value); return /^[\s\uFEFF]*[=+\-@\t\r]/.test(value) ? "'" + value : value; }
  function csv(rows) { return rows.map(row => row.map(value => '"' + safeCell(value).replace(/"/g, '""') + '"').join(',')).join('\r\n') + '\r\n'; }
  const TYPES = Object.freeze(['text','integer','decimal','decimal-comma','date','email','url']);
  function inspect(text, delimiter='auto') {
    if(typeof text!=='string'||new TextEncoder().encode(text).length>2e6) throw Error('Use UTF-8 CSV text no larger than 2 MB.');
    const parsed = parseCSV(text, delimiter), headers = parsed.rows[0].map(value=>value.trim());
    if (headers.some(value=>!value) || new Set(headers).size!==headers.length) throw Error('Headers must be nonempty and unique after trimming.');
    return {headers,delimiter:parsed.delimiter,dataRows:parsed.rows.length-1};
  }
  function valid(value,type) {
    if (type==='text') return true;
    if (type==='integer') return /^[-+]?\d+$/.test(value) && Number.isSafeInteger(Number(value));
    if (type==='decimal' || type==='decimal-comma') {
      const regex = type==='decimal' ? /^[-+]?\d+(?:\.\d+)?$/ : /^[-+]?\d+(?:,\d+)?$/;
      return regex.test(value) && Number.isFinite(Number(value.replace(',','.'))) && Math.abs(Number(value.replace(',','.')))<=1e15;
    }
    if (type==='date') return /^\d{4}-\d{2}-\d{2}$/.test(value) && value>='1900-01-01' && value<='9999-12-31' && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
    if (type==='email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (type==='url') { try { const u=new URL(value);return ['http:','https:'].includes(u.protocol) && !!u.hostname; } catch { return false; } }
    return false;
  }
  function analyze(text, options={}) {
    const {delimiter='auto',trim=true,dedupe=true,columns}=options;
    if(typeof trim!=='boolean'||typeof dedupe!=='boolean') throw Error('trim and dedupe must be true or false.');
    const parsed=parseCSV(text,delimiter),headers=inspect(text,delimiter).headers;
    const rules=columns===undefined ? headers.map(source=>({source,target:source,type:'text',required:false})) : columns;
    if(!Array.isArray(rules)||rules.length!==headers.length) throw Error('Map every source column exactly once; no silent column dropping.');
    const names=new Set(),sources=new Set();
    for(const rule of rules) {
      if(!rule||!headers.includes(rule.source)||sources.has(rule.source)) throw Error('Each source column must be mapped exactly once.');
      if(typeof rule.target!=='string'||!rule.target.trim()||rule.target!==rule.target.trim()||rule.target.length>200||/[\x00-\x1f]/.test(rule.target)||names.has(rule.target)) throw Error('Target names must be unique, trimmed, nonempty and at most 200 characters.');
      if(!TYPES.includes(rule.type)||typeof rule.required!=='boolean') throw Error('Choose a supported type and explicit required flag.');
      sources.add(rule.source);names.add(rule.target);
    }
    const indices=rules.map(rule=>headers.indexOf(rule.source)),outputHeaders=rules.map(rule=>rule.target);
    const accepted=[],rejected=[],issues=[],duplicates=[],blankRows=[],seen=new Map();
    parsed.rows.slice(1).forEach((input,index)=>{
      const record=index+1; // Logical data record, excluding header; not a physical line number.
      if(input.every(cell=>!cell.trim())) {blankRows.push(record);return;}
      if(input.length!==headers.length) {
        const problem={record,code:'column_count',message:`Expected ${headers.length} fields, received ${input.length}.`};
        issues.push(problem);rejected.push({record,original:input,issues:[problem]});return;
      }
      const row=indices.map(i=>trim?input[i].trim():input[i]),problems=[];
      rules.forEach((rule,i)=>{
        const value=row[i];
        if(!value.trim()) { if(rule.required) problems.push({record,column:rule.target,code:'required',message:'Required value is empty.'}); }
        else if(!valid(value,rule.type)) problems.push({record,column:rule.target,code:'type',message:`Expected ${rule.type}; value retained without guessing.`});
      });
      if(problems.length) {issues.push(...problems);rejected.push({record,original:input,issues:problems});return;}
      const key=JSON.stringify(row);
      if(dedupe&&seen.has(key)) {duplicates.push({record,duplicateOf:seen.get(key)});return;}
      seen.set(key,record);accepted.push({record,values:row});
    });
    const protectedCells=[outputHeaders,...accepted.map(row=>row.values)].flat().filter(value=>safeCell(value)!==value).length;
    return {version:'1.0.0',delimiter:parsed.delimiter,headers:outputHeaders,
      summary:{inputRecords:parsed.rows.length-1,accepted:accepted.length,rejected:rejected.length,duplicates:duplicates.length,blank:blankRows.length,issues:issues.length,protectedCells},
      accepted,rejected,issues,duplicates,blankRows,
      cleanedCSV:csv([outputHeaders,...accepted.map(row=>row.values)]),
      rejectedCSV:csv([['record','original_fields_json','issues_json'],...rejected.map(row=>[row.record,JSON.stringify(row.original),JSON.stringify(row.issues)])])};
  }
  return Object.freeze({parseCSV,inspect,analyze,csv,TYPES});
});
