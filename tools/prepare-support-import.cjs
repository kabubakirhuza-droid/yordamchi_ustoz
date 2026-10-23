// Builds private, resumable SQL batches from the user's existing Apps Script exports.
const fs = require('node:fs');
const path = require('node:path');
const directory = process.argv[2];
if (!directory) throw new Error('Pass the private source directory');
const quote = value => "'" + String(value).replace(/'/g,"''") + "'";
const settings = [], batches = [];
for (const district of ['sergeli','uchtepa']) {
  const source=JSON.parse(fs.readFileSync(path.join(directory,district+'-migration-source.json'),'utf8'));
  if(!Array.isArray(source.bookings))throw Error('Invalid booking source: '+district);
  const raw=source.config,config={...(raw.config || raw)};
  for(const key of ['courses','teachers','courseTeachers','teacherSchedule','holidayDates','courseExcludedDays','deletedTeachers','deletedCourses'])if(raw[key]!==undefined)config[key]=raw[key];
  config.district=district;
  settings.push(`insert into public.support_settings(district,config) values (${quote(district)},${quote(JSON.stringify(config))}::jsonb) on conflict(district) do nothing;`);
  const rows=source.bookings.map(row=>{
    const originalDate=String(row.sana);
    const nativeDate=originalDate.match(/^[A-Za-z]{3} ([A-Za-z]{3}) (\d{1,2}) (\d{4}) /);
    const nativeMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const normalizedDate=nativeDate ? String(nativeDate[2]).padStart(2,'0')+'.'+String(nativeMonths.indexOf(nativeDate[1])+1).padStart(2,'0')+'.'+nativeDate[3] : originalDate;
    const match=normalizedDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if(!match)throw Error('Invalid date '+district+' '+row.id);
    const iso=`${match[3]}-${match[2]}-${match[1]}`,time=(String(row.dars_vaqti).match(/ (\d{2}:\d{2}):\d{2} GMT/)?.[1] || String(row.dars_vaqti)).padStart(5,'0');
    if(!/^\d{2}:\d{2}$/.test(time))throw Error('Invalid time '+row.id);
    if(row.telefon==='#ERROR!')throw Error('Unrepaired source phone '+row.id);
    const payload={id:row.id,requestId:row.id,ism:row.ism,familiya:row.familiya,telefon:row.telefon,kurs:row.kurs,ustoza:row.ustoza==='—'?'':row.ustoza,sana:normalizedDate,vaqt:time,dateISO:iso};
    const stamp=String(row.id).match(/^B-(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    const created=stamp?`20${stamp[1]}-${stamp[2]}-${stamp[3]}T${stamp[4]}:${stamp[5]}:${stamp[6]}+05:00`:new Date().toISOString();
    return `(${[district,row.id,row.id,row.kurs,iso,time,payload.ustoza,row.status||'Yangi',JSON.stringify(payload),created].map(quote).join(',')})`;
  });
  for(let i=0;i<rows.length;i+=40){
    const name=district+'-import-'+String(i/40).padStart(2,'0')+'.sql';
    fs.writeFileSync(path.join(directory,name),`insert into public.support_bookings(district,id,request_id,course,lesson_date,lesson_time,teacher,status,payload,created_at) values\n${rows.slice(i,i+40).join(',\n')}\non conflict(district,id) do nothing;`);
    batches.push(name);
  }
  console.log(district+': '+rows.length+' rows prepared');
}
fs.writeFileSync(path.join(directory,'settings-import.sql'),settings.join('\n'));
fs.writeFileSync(path.join(directory,'support-import-batches.json'),JSON.stringify(batches));
