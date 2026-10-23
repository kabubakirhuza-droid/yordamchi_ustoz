const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let month = '10.2026';
const ctx = vm.createContext({
  Utilities: { formatString: (_, h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, formatDate: () => month },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }
});
vm.runInContext(fs.readFileSync('Code.gs','utf8'), ctx);
assert.equal(ctx.sheetNameFor_('Arab tili grammatikasi','10.2026'), 'Arab tili grammatikasi — Oktabr 2026');
assert.equal(ctx.sheetNameFor_('Arab tili grammatikasi','11.2026'), 'Arab tili grammatikasi — Noyabr 2026');
assert.equal(ctx.sheetNameFor_('Arab tili grammatikasi','01.2027'), 'Arab tili grammatikasi — Yanvar 2027');
const sheet = name => ({ getName: () => name });
assert.equal(ctx.findMatchingSheet_({getSheets:()=>[sheet('Arab tili grammatikasi — Oktabr 2026')]},'Arab tili','10.2026'),null);
assert.equal(ctx.findMatchingSheet_({getSheets:()=>[sheet('Arab tili grammatikasi — Noyabr 2026')]},'Arab tili grammatikasi','10.2026'),null);
const tabs = new Map();
ctx.getAppConfig_ = () => ({ courses: [{name:'Arab tili grammatikasi'}, {name:'Inactive',active:false}] });
ctx.getOrCreateCourseSheet_ = (name, key) => { const title=ctx.sheetNameFor_(name,key); if(!tabs.has(title)) tabs.set(title,sheet(title)); return tabs.get(title); };
let triggers=[];
let created=0;
let logHidden=false;
ctx.SpreadsheetApp={getActiveSpreadsheet:()=>({
  getSheetByName:name=>name==='Royxat'?{isSheetHidden:()=>logHidden,hideSheet(){logHidden=true;}}:tabs.get(name),
  setActiveSheet(){}
})};
const builder={timeBased(){return this},everyDays(){return this},atHour(){return this},inTimezone(){return this},create(){created++;triggers.push({getHandlerFunction:()=> 'createCurrentMonthSheets'});}};
ctx.ScriptApp={getProjectTriggers:()=>triggers,newTrigger:()=>builder};
ctx.setupMonthlySheets();ctx.setupMonthlySheets();
assert.equal(created,1);assert.equal(tabs.size,1);
assert.equal(logHidden,true);
month='11.2026';ctx.createCurrentMonthSheets();assert.equal(tabs.size,2);
month='01.2027';ctx.createCurrentMonthSheets();assert.equal(tabs.size,3);
assert.ok(tabs.has('Arab tili grammatikasi — Oktabr 2026'));
console.log('Monthly naming, rollover, old tabs, inactive courses and trigger deduplication passed');
