import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const directory=process.argv[2];
if(!directory)throw new Error('Pass the private verification directory');
for(const [key,file] of Object.entries({SUPPORT_BACKEND_URL:'support-url.txt',SUPPORT_ANON_KEY:'support-anon.txt',SUPPORT_GATEWAY_TOKEN:'support-gateway-token.txt',AUTH_SECRET:'support-auth-secret.txt'}))process.env[key]=fs.readFileSync(path.join(directory,file),'utf8').trim();
const auth=(await import('../api/auth.js')).default;
const sync=(await import('../api/sync.js')).default;
const teacher=(await import('../api/teacher.js')).default;
const publicConfig=(await import('../api/public-config.js')).default;
async function invoke(handler,{method='GET',query={},body={},token='',district='sergeli'}={}){
  const req={method,query:{district,...query},body,headers:{authorization:token?'Bearer '+token:'','x-district':district,'x-forwarded-for':'198.51.100.77'}};
  const res={code:200,setHeader(){},status(value){this.code=value;return this},json(value){this.data=value;return this}};
  await handler(req,res);return res;
}
const credentials=JSON.parse(fs.readFileSync(path.join(directory,'support-test-credentials.json'),'utf8'));
const loginData={};
for(const district of ['sergeli','uchtepa']){
  const snapshot=JSON.parse(fs.readFileSync(path.join(directory,district+'-migration-source.json'),'utf8'));
  const {password}=credentials[district];
  const logged=await invoke(auth,{method:'POST',body:{login:'zinnur-'+district,password,district},district});
  assert.equal(logged.code,200,'Admin login '+district);assert.equal(logged.data.district,district);
  loginData[district]={login:'zinnur-'+district,password,token:logged.data.token};
  const loaded=await invoke(sync,{token:logged.data.token,query:{action:'getConfig'},district});
  assert.equal(loaded.code,200);assert.equal(loaded.data.bookings.length,snapshot.bookings.length);
  const anonymous=await invoke(sync,{query:{action:'getConfig'},district});assert.equal(anonymous.code,401);
  const cross=await invoke(sync,{token:logged.data.token,query:{action:'getConfig'},district:district==='sergeli'?'uchtepa':'sergeli'});assert.equal(cross.code,403);
  const publicResult=await invoke(publicConfig,{district});assert.equal(publicResult.code,200);
  for(const profile of publicResult.data.config.teachers)for(const field of ['pin','phone','login','password'])assert.ok(!(field in profile));
  const profile=loaded.data.config.teachers.find(t=>t.pin&&t.id);
  const teacherLogin=await invoke(teacher,{method:'POST',district,body:{action:'login',login:profile.login||profile.phone,pin:String(profile.pin)}});
  assert.equal(teacherLogin.code,200,'Teacher login '+district);
  const own=await invoke(teacher,{district,token:teacherLogin.data.token});assert.equal(own.code,200);
  assert.ok(own.data.bookings.every(b=>b.teacherName===profile.name));
  const forbidden=await invoke(sync,{district,token:teacherLogin.data.token,query:{action:'getConfig'}});assert.equal(forbidden.code,401);
  const saved=await invoke(teacher,{method:'POST',district,token:teacherLogin.data.token,body:{action:'save_state',attendance:own.data.state?.attendance||{},notes:own.data.state?.notes||{}}});assert.equal(saved.data.success,true);
  const invalid=await invoke(sync,{method:'POST',district,body:{action:'register',requestId:crypto.randomUUID(),ism:'Test',familiya:'Validation',telefon:'+998 90 000 00 00',kurs:publicResult.data.config.courses[0].name,sana:'31.02.2026',vaqt:'09:00'}});assert.equal(invalid.data.success,false);
  console.log(JSON.stringify({district,adminLogin:true,bookings:loaded.data.bookings.length,teacherLogin:true,teacherBookings:own.data.bookings.length,districtIsolation:true,publicCredentialsHidden:true,attendanceSaved:true,invalidDatesRejected:true}));
}
fs.writeFileSync(path.join(directory,'verified-admin-sessions.json'),JSON.stringify(loginData),{mode:0o600});
