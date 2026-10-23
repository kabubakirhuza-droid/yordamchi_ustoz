const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const front=fs.readFileSync('script.js','utf8'),edge=fs.readFileSync('supabase/functions/support-api/index.ts','utf8');
function extract(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0);return source.slice(start,source.indexOf('\n}',start)+2);}
const ctx=vm.createContext({COURSE_TEACHERS:{English:['Busy','Free']},COURSES:{English:{capacity:1},Solo:{capacity:4}},TEACHER_SCHEDULE:{Busy:{start:'14:00',end:'17:00',offDays:[]},Free:{start:'14:00',end:'17:00',offDays:[]}},timeToMinutes:t=>Number(t.slice(0,2))*60+Number(t.slice(3))});
for(const name of ['timetableCapacity','isTeacherScheduled'])vm.runInContext(extract(front,name),ctx);
const monday=new Date(2026,9,26);assert.equal(ctx.timetableCapacity('English',monday,'14:30'),2);assert.equal(ctx.timetableCapacity('English',monday,'09:00'),0);assert.equal(ctx.timetableCapacity('Solo',monday,'14:30'),4);
ctx.parseDate=()=>({day:1});for(const name of ['teacherWorksAt','fullTeacherCount'])vm.runInContext(extract(edge,name),ctx);
const teachers=[{name:'Busy',startTime:'14:00',endTime:'17:00'},{name:'Free',startTime:'14:00',endTime:'17:00'}];
assert.equal(ctx.fullTeacherCount(teachers,{Busy:1},1,'26.10.2026','14:30'),1);assert.ok(ctx.fullTeacherCount(teachers,{Busy:1},1,'26.10.2026','14:30')<ctx.timetableCapacity('English',monday,'14:30'),'One free teacher keeps the slot open');
assert.equal(ctx.fullTeacherCount(teachers,{Busy:1,Free:1},1,'26.10.2026','14:30'),2);
assert.equal(ctx.fullTeacherCount(teachers,{Busy:1},2,'26.10.2026','14:30'),0,'Partly occupied teacher is not full');
assert.equal(ctx.fullTeacherCount([{...teachers[0],daysOff:[1]}],{Busy:1},1,'26.10.2026','14:30'),0);
console.log('Teacher slot capacity, working hours, partial group checks passed');
