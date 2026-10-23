import { generateToken, verifyToken } from './auth.js';
import { supportCall, requestDistrict, requestRateKey } from '../lib/support-gateway.js';

const DEFAULT_DISTRICT = 'sergeli';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const district = requestDistrict(req, DEFAULT_DISTRICT);
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (req.method === 'POST' && body.action === 'login') {
      const result = await supportCall('teacher_login', district, { login: body.login, pin: body.pin }, {rateKey:requestRateKey(req)});
      if (!result.success) return res.status(401).json(result);
      const teacher = result.teacher;
      return res.status(200).json({ success:true, teacher, token:generateToken({role:'teacher',district,teacherId:teacher.id,teacherName:teacher.name}) });
    }
    const token = verifyToken((req.headers.authorization || '').replace(/^Bearer /,''));
    if (!token || token.role !== 'teacher' || token.district !== district) return res.status(401).json({success:false,error:'unauthorized'});
    const scope = { teacherId:token.teacherId, teacherName:token.teacherName };
    if (req.method === 'GET') {
      const [result,state] = await Promise.all([supportCall('get_config',district,{},scope), supportCall('teacher_state',district,{},scope)]);
      return res.status(200).json({...result,state:state.data});
    }
    if (req.method === 'POST' && body.action === 'save_state') {
      const result = await supportCall('teacher_state',district,{data:{attendance:body.attendance || {},notes:body.notes || {}}},scope);
      return res.status(200).json(result);
    }
    if (req.method === 'POST' && body.action === 'complete_lesson') {
      const owned = await supportCall('get_bookings',district,{},scope);
      if (!owned.some(b => b.id === body.id)) return res.status(403).json({success:false,error:'forbidden'});
      return res.status(200).json(await supportCall('update_status',district,{id:body.id,status:'Yakunlangan'}));
    }
    return res.status(405).json({success:false,error:'method_not_allowed'});
  } catch(error) {
    const status=[401,403,429].includes(error.status)?error.status:503;
    return res.status(status).json({success:false,error:status===503?'server_unavailable':error.message});
  }
}
