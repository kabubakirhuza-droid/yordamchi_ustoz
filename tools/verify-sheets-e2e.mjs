import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=process.argv[2],phase=process.argv[3]||'register';
for(const [key,file] of Object.entries({SUPPORT_BACKEND_URL:'support-url.txt',SUPPORT_ANON_KEY:'support-anon.txt',SUPPORT_GATEWAY_TOKEN:'support-gateway-token.txt'}))process.env[key]=fs.readFileSync(path.join(dir,file),'utf8').trim();
const {supportCall}=await import('../lib/support-gateway.js');
const file=path.join(dir,'sheet-e2e-bookings.json');
const cases=phase==='register'?[]:JSON.parse(fs.readFileSync(file,'utf8'));
if(phase==='register')for(const district of ['sergeli','uchtepa']){
 const payload={action:'register',requestId:crypto.randomUUID(),ism:'AUTO TEST',familiya:'Server tekshiruv',telefon:'+998900000000',kurs:district==='sergeli'?'Arab tili - Harf':'Arab tili grammatikasi',sana:'26.10.2026',vaqt:district==='sergeli'?'13:00':'14:00',ustoza:district==='sergeli'?'Feruza ustoza':'Mahbuba U'};
 const first=await supportCall('register',district,payload);assert.equal(first.success,true,JSON.stringify(first));cases.push({district,payload,id:first.bookingId});fs.writeFileSync(file,JSON.stringify(cases));
 const repeat=await supportCall('register',district,payload);assert.equal(repeat.bookingId,first.bookingId);assert.equal(repeat.duplicate,true);
 console.log(JSON.stringify({district,registered:true,retryDeduplicated:true,id:first.bookingId}));
}
if(phase==='cleanup')for(const item of cases){const result=await supportCall('delete_booking',item.district,{id:item.id});assert.equal(result.success,true);console.log(JSON.stringify({district:item.district,testRemoved:true}));}
console.log(JSON.stringify(await supportCall('sync_sheets','sergeli',{})));
