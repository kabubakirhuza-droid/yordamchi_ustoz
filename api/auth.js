import crypto from 'node:crypto';
import { supportCall, requestRateKey, requestDistrict } from '../lib/support-gateway.js';
const AUTH_SECRET=process.env.AUTH_SECRET;
export function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  if(!AUTH_SECRET)return null;
  const [header, data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${data}`).digest('base64url');
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expectedSignature))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (!Number.isFinite(payload.exp) || Date.now() > payload.exp || !['sergeli','uchtepa'].includes(payload.district)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}


export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method==='GET'){
      const decoded=verifyToken((req.headers.authorization||'').replace(/^Bearer /,''));
      if(!decoded||decoded.role==='teacher')return res.status(401).json({success:false,message:'Sessiya tugagan. Qayta kiring.'});
      return res.status(200).json({success:true,authenticated:true,district:decoded.district,user:{login:decoded.login,district:decoded.district,role:decoded.role}});
    }
    if(req.method!=='POST')return res.status(405).json({success:false});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const login=String(body.login||body.username||'').trim().toLowerCase();
    let district=body.district==='uchtepa'||body.district==='sergeli'?body.district:requestDistrict(req,'sergeli');
    if(login.includes('uchtepa'))district='uchtepa';else if(login.includes('sergeli'))district='sergeli';
    const changing=body.action==='change_credentials';
    if(changing){
      const decoded=verifyToken((req.headers.authorization||'').replace(/^Bearer /,''));
      if(!decoded||decoded.role==='teacher'||decoded.district!==district)return res.status(401).json({success:false,message:'Qayta kiring.'});
    }
    const result=await supportCall(changing?'admin_change_credentials':'admin_login',district,{...body,login},{rateKey:requestRateKey(req)});
    if(!result.success)return res.status(401).json({success:false,message:result.error==='rate_limited'?'Bir daqiqadan keyin qayta urinib ko‘ring.':'Login yoki parol noto‘g‘ri.'});
    const token=generateToken({login:result.login,district:result.district,role:result.role});
    return res.status(200).json({...result,token,newLogin:changing?result.login:undefined,message:changing?'Login va parol saqlandi.':'Muvaffaqiyatli avtorizatsiya'});
  }catch{return res.status(503).json({success:false,message:'Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.'});}
}
