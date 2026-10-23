const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
for(const file of ['Code.gs']){
 const ctx=vm.createContext({Utilities:{formatString:(_,h,m)=>`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(alg,value)=>[...crypto.createHash(alg).update(value).digest()]}});
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx);ctx.jsonOutput_=x=>x;
 assert.equal(ctx.authorizedSupportRequest_({}),false);assert.equal(ctx.authorizedSupportRequest_({_supportToken:'invalid'}),false);
 assert.equal(ctx.doPost({postData:{contents:JSON.stringify({action:'delete_booking',id:'real-id'})}}).error,'unauthorized');
 for(const action of ['get_config','getConfig','get_bookings'])assert.equal(ctx.doGet({parameter:{action}}).error,'unauthorized');
 const privateDir=process.argv[2];if(privateDir){const token=fs.readFileSync(privateDir+'/support-gateway-token.txt','utf8').trim();assert.equal(ctx.authorizedSupportRequest_({_supportToken:token}),true);}
}
for(const file of ['admin.js']){const text=fs.readFileSync(file,'utf8');assert.ok(!text.includes('magic_invite_admin_token'));assert.ok(text.includes('restoreSession'));}
console.log('Legacy private reads, unsigned mutations, invalid worker credentials and magic-link bypass rejected');
