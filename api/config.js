import sync from './sync.js';
export default function handler(req,res){
  if(req.method==='GET')req.query.action=req.query.action||'get_config';
  if(req.method==='POST'){
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    req.body={...body,action:body.action||'save_config'};
  }
  return sync(req,res);
}
