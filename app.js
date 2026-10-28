'use strict';
const $=id=>document.getElementById(id);
let mapping=[],report=null,inspectedText='';
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
function invalidate(){report=null;for(const id of ['download-good','download-rejected','download-report'])$(id).disabled=true;$('results').hidden=true;}
function message(text,bad=false){$('status').textContent=text;$('status').className=bad?'error':'notice';}
function inspectColumns(preset){
  invalidate();
  try{
    const result=CSVQuality.inspect($('csv').value,$('delimiter').value);
    inspectedText=$('csv').value;mapping=[];$('mapping').replaceChildren();
    for(const source of result.headers){
      const rule=preset?.columns.find(c=>c.source===source)||{target:source,type:'text',required:false};
      const card=node('div');card.className='column-rule';
      const title=node('strong',source);const nameLabel=node('label','Output name');
      const target=node('input');target.value=rule.target;target.maxLength=200;target.setAttribute('aria-label','Output name for '+source);nameLabel.append(target);
      const typeLabel=node('label','Check');const type=node('select');type.setAttribute('aria-label','Type for '+source);
      for(const value of CSVQuality.TYPES){const opt=node('option',value);opt.value=value;type.append(opt);}type.value=rule.type;typeLabel.append(type);
      const reqLabel=node('label');reqLabel.className='check';const required=node('input');required.type='checkbox';required.checked=rule.required;reqLabel.append(required,node('span','Required'));
      card.append(title,nameLabel,typeLabel,reqLabel);$('mapping').append(card);mapping.push({source,target,type,required});
      for(const control of [target,type,required])control.addEventListener('change',invalidate);
    }
    $('step-two').hidden=false;$('analyze').disabled=false;
    message(`${result.headers.length} columns · ${result.dataRows} data records. Review the rules, then run the report.`);
  }catch(error){$('step-two').hidden=true;$('analyze').disabled=true;message(error.message,true);}
}
function run(){
  invalidate();
  try{
    if(inspectedText!==$('csv').value)throw Error('CSV changed. Inspect columns again before analysing.');
    report=CSVQuality.analyze($('csv').value,{delimiter:$('delimiter').value,trim:$('trim').checked,dedupe:$('dedupe').checked,columns:mapping.map(m=>({source:m.source,target:m.target.value,type:m.type.value,required:m.required.checked}))});
    $('summary').replaceChildren();
    for(const [label,key] of [['Accepted','accepted'],['Needs review','rejected'],['Duplicates','duplicates'],['Blank records','blank']]){const card=node('div');card.className='stat';card.append(node('strong',String(report.summary[key])),node('span',label));$('summary').append(card);}
    $('issues').replaceChildren();for(const issue of report.issues.slice(0,30))$('issues').append(node('li',`Record ${issue.record}${issue.column?' · '+issue.column:''}: ${issue.message}`));
    if(!report.issues.length)$('issues').append(node('li','No rejected records under the rules you selected. This does not verify the facts in the data.'));
    const table=node('table'),head=node('thead'),tr=node('tr');for(const h of ['Record',...report.headers])tr.append(node('th',h));head.append(tr);table.append(head);
    const body=node('tbody');for(const row of report.accepted.slice(0,12)){const tr=node('tr');for(const cell of [row.record,...row.values])tr.append(node('td',String(cell)));body.append(tr);}table.append(body);$('preview').replaceChildren(table);
    $('results').hidden=false;for(const id of ['download-good','download-rejected','download-report'])$(id).disabled=false;
    message(`${report.summary.issues} validation issues. ${report.summary.protectedCells} formula-like cells will be escaped in the accepted CSV. Preview shows up to 12 accepted records; JSON contains all records and issues.`);
  }catch(error){message(error.message,true);}
}
function download(kind){if(!report)return;const content=kind==='json'?JSON.stringify(report,null,2):kind==='rejected'?report.rejectedCSV:report.cleanedCSV;const blob=new Blob([content],{type:kind==='json'?'application/json':'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=kind==='json'?'csv-quality-report.json':kind==='rejected'?'csv-needs-review.csv':'csv-accepted.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('inspect').addEventListener('click',()=>inspectColumns());$('analyze').addEventListener('click',run);
$('example').addEventListener('click',()=>{$('csv').value=EXAMPLE_CSV;$('delimiter').value='auto';inspectColumns(EXAMPLE_SCHEMA);});
$('csv').addEventListener('input',()=>{invalidate();$('analyze').disabled=true;message('Input changed. Inspect columns to update the mapping.');});
$('delimiter').addEventListener('change',()=>{invalidate();$('analyze').disabled=true;message('Delimiter changed. Inspect columns again.');});
for(const id of ['trim','dedupe'])$(id).addEventListener('change',invalidate);
$('file').addEventListener('change',async()=>{try{const file=$('file').files[0];if(!file)return;if(file.size>2e6)throw Error('File exceeds 2 MB.');$('csv').value=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());inspectColumns();}catch(error){invalidate();message('Cannot read file: '+error.message,true);}});
$('download-good').addEventListener('click',()=>download('good'));$('download-rejected').addEventListener('click',()=>download('rejected'));$('download-report').addEventListener('click',()=>download('json'));
$('csv').value=EXAMPLE_CSV;inspectColumns(EXAMPLE_SCHEMA);
