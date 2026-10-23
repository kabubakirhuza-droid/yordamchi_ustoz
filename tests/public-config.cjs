const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const code=fs.readFileSync('api/public-config.js','utf8').replace("import { supportCall, supportEnabled } from '../lib/support-gateway.js';", 'const supportEnabled=()=>false;');const mod=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const safe=mod.publicConfig({config:{courses:[],teachers:[{id:'t1',name:'Teacher',pin:'secret',phone:'private',login:'private',dailyHours:{}}],bookings:[{phone:'student'}],scriptUrl:'private'}});
assert.equal(safe.teachers[0].name,'Teacher');assert.ok(!JSON.stringify(safe).includes('private'));assert.ok(!JSON.stringify(safe).includes('secret'));console.log('Public settings exclude student history and teacher credentials');})();
