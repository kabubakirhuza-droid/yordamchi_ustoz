// This gateway is called by the two trusted website servers, never directly by browsers.
const SCRIPTS = {
  sergeli: 'https://script.google.com/macros/s/AKfycbzk8hu77h_nGcUpnqe9aAPHtxX8LQrH4inmRkt1igiusHfcofkl0YeEniLsioYaBDc1/exec',
  uchtepa: 'https://script.google.com/macros/s/AKfycbyCiT0-u7NqvJ9AYxyA-bO8hPVNdV4ef9A3vtgQPLKHuU6KwOHsZeK-8WTEpt2QT2jf_Q/exec'
};
const databaseURL = Deno.env.get('SUPABASE_URL');
const databaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const dbHeaders = { apikey: databaseKey, Authorization: `Bearer ${databaseKey}`, 'Content-Type': 'application/json' };
async function db(path, method = 'GET', body = undefined, prefer = '') {
  const response = await fetch(`${databaseURL}/rest/v1/${path}`, {
    method, headers: { ...dbHeaders, ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) { console.error('Support database request failed', response.status, path.split('?')[0]); throw new Error('database_unavailable'); }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const eq = value => encodeURIComponent(value);
const sha256 = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b => b.toString(16).padStart(2, '0')).join('');
const safeTeacher = teacher => Object.fromEntries(Object.entries(teacher).filter(([key]) => ['id','name','courses','startTime','endTime','daysOff','dailyHours'].includes(key)));
function publicSettings(config) {
  const safe = {};
  for (const key of ['courses','courseTeachers','teacherSchedule','deletedTeachers','deletedCourses','holidayDates','courseExcludedDays']) if (config[key] !== undefined) safe[key] = config[key];
  safe.teachers = (config.teachers || []).map(safeTeacher);
  return safe;
}
function panelBooking(row) {
  const b = row.payload;
  return { id: row.id, studentName: `${b.ism || ''} ${b.familiya || ''}`.trim(), phone: b.telefon || '',
    courseName: row.course, teacherName: row.teacher || 'Biriktirilmagan', date: b.sana,
    time: String(row.lesson_time).slice(0,5), status: row.status, createdAt: row.created_at };
}
async function settings(district) {
  const rows = await db(`support_settings?district=eq.${eq(district)}&select=config`);
  if (!rows.length) throw new Error('district_not_configured');
  const config=rows[0].config;
  const normalize=value=>String(value||'').trim().toLowerCase();
  const removedTeachers=new Set((config.deletedTeachers||[]).map(normalize).filter(Boolean));
  const removedCourses=new Set((config.deletedCourses||[]).map(normalize).filter(Boolean));
  config.teachers=(config.teachers||[]).filter(t=>t.active!==false && ![t.id,t.name,t.phone,t.login,String(t.phone||t.login||'').replace(/\D/g,'')].some(value=>removedTeachers.has(normalize(value))));
  if(Array.isArray(config.courses))config.courses=config.courses.filter(c=>![c.id,c.name].some(value=>removedCourses.has(normalize(value))));
  config.courseTeachers={};
  for(const teacher of config.teachers)for(const course of teacher.courses||[]){
    if(!removedCourses.has(normalize(course))){if(!config.courseTeachers[course])config.courseTeachers[course]=[];config.courseTeachers[course].push(teacher.name);}
  }
  return config;
}
async function bookings(district, teacher = null, course = null, date = null) {
  let query = `support_bookings?district=eq.${eq(district)}&deleted_at=is.null&order=created_at.desc&limit=5000`;
  if (teacher) query += `&teacher=eq.${eq(teacher)}`;
  if (course) query += `&course=eq.${eq(course)}`;
  if (date) query += `&lesson_date=eq.${eq(date)}`;
  return await db(query);
}
function parseDate(value) {
  const match = String(value || '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(iso + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0,10) === iso ? { iso, day: date.getUTCDay() } : null;
}
function getCourse(config, name) {
  return Array.isArray(config.courses) ? config.courses.find(c => c.name === name && c.active !== false)
    : config.courses?.[name];
}
function teacherWorksAt(teacher, day, time) {
  const daily = teacher.dailyHours?.[day];
  if (daily?.isWork === false || (!daily && (teacher.daysOff || []).includes(day))) return false;
  return time >= (daily?.start || teacher.startTime || '00:00') && time <= (daily?.end || teacher.endTime || '23:59');
}
function fullTeacherCount(teachers, counts, capacity, date, time) {
  const day = parseDate(date)?.day;
  return teachers.filter(t => teacherWorksAt(t,day,time) && (counts[t.name] || 0) >= capacity).length;
}
async function register(district, payload, config) {
  for (const key of ['ism','familiya','telefon','kurs','sana','vaqt','requestId']) {
    if (typeof payload[key] !== 'string' || !payload[key].trim() || payload[key].length > 200) return { success: false, error: 'missing_fields' };
  }
  const course = getCourse(config, payload.kurs);
  const date = parseDate(payload.sana);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
  if (!course || config.deletedCourses?.includes(payload.kurs)) return { success: false, error: 'unknown_course' };
  if (!date || date.iso < today || !/^\d{2}:\d{2}$/.test(payload.vaqt)) return { success: false, error: 'invalid_date' };
  const minutes = time => Number(time.split(':')[0]) * 60 + Number(time.split(':')[1]);
  const start = course.startTime || `${String(course.startHour ?? 9).padStart(2,'0')}:${String(course.startMin || 0).padStart(2,'0')}`;
  const end = course.endTime || `${String(course.endHour ?? 17).padStart(2,'0')}:${String(course.endMin || 0).padStart(2,'0')}`;
  const time = minutes(payload.vaqt), step = course.slotDuration || course.stepMin || 30;
  if (time < minutes(start) || time > minutes(end) || (time - minutes(start)) % step) return { success: false, error: 'unknown_time' };
  if ((config.holidayDates || []).some(h => (typeof h === 'string' ? h : h.date) === payload.sana)
    || (config.courseExcludedDays?.[payload.kurs] || course.excludedDays || []).includes(date.day)) return { success:false,error:'closed_day' };
  const assigned = (config.teachers || []).filter(t => (t.courses || []).includes(payload.kurs) && !config.deletedTeachers?.includes(t.id) && !config.deletedTeachers?.includes(t.name));
  if (assigned.length) {
    const teacher = assigned.find(t => t.name === payload.ustoza);
    if (!teacher) return { success: false, error: 'missing_ustoza' };
    const daily = teacher.dailyHours?.[date.day];
    if (daily?.isWork === false || (!daily && (teacher.daysOff || []).includes(date.day))
      || time < minutes(daily?.start || teacher.startTime || start) || time > minutes(daily?.end || teacher.endTime || end)) return { success: false, error: 'teacher_unavailable' };
  }
  if (!/^\+?998[\s\d-]+$/.test(payload.telefon) || payload.telefon.replace(/\D/g,'').length !== 12) return {success:false,error:'invalid_phone'};
  const booking = { ...payload, id: crypto.randomUUID(), dateISO: date.iso, kun: ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'][date.day] };
  return await db('rpc/support_reserve_booking', 'POST', { p_district: district, p_booking: booking, p_capacity: Number(course.capacity) || 4 });
}
async function syncSheetsBatch(token) {
  const jobs = await db('rpc/support_claim_sheet_jobs', 'POST', { p_limit: 2 });
  let completed = 0;
  await Promise.all(jobs.map(async job => {
    try {
      const response = await fetch(SCRIPTS[job.district], { method: 'POST', headers: {'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify({...job.payload,_supportToken:token}), redirect: 'follow', signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error || 'sheets_unconfirmed');
      await db(`support_sheet_outbox?id=eq.${job.id}`, 'PATCH', { processed_at: new Date().toISOString(), locked_until: null, last_error: null });
      completed++;
    } catch (error) {
      const delay = Math.min(3600, 15 * 2 ** Math.min(job.attempts,8));
      await db(`support_sheet_outbox?id=eq.${job.id}`, 'PATCH', { locked_until: null, last_error: String(error.message).slice(0,300), available_at: new Date(Date.now()+delay*1000).toISOString() });
    }
  }));
  return { success: true, completed, attempted: jobs.length };
}
async function syncSheets(token) {
  const started=Date.now(); let completed=0,attempted=0;
  for(let pass=0;pass<15 && Date.now()-started<40000;pass++) {
    const result=await syncSheetsBatch(token);completed+=result.completed;attempted+=result.attempted;
    if(!result.attempted)break;
  }
  return {success:true,completed,attempted};
}
function backgroundSync(token) { EdgeRuntime.waitUntil(syncSheets(token).catch(error => console.error('Sheet worker:', error.message))); }
Deno.serve(async req => {
  try {
    const token = req.headers.get('x-support-token') || '';
    const keys = await db('support_gateway?name=eq.website&select=token_hash');
    if (!token || !keys.length || await sha256(token) !== keys[0].token_hash) return Response.json({success:false,error:'unauthorized'},{status:401});
    const body = await req.json();
    if (body.action === 'sync_sheets') return Response.json(await syncSheets(token));
    const district = body.district;
    if (!SCRIPTS[district]) return Response.json({success:false,error:'invalid_district'},{status:400});
    const config = await settings(district);
    const action = body.action;
    if(body.teacherId) {
      const profile=(config.teachers || []).find(t=>t.id===body.teacherId && !config.deletedTeachers?.includes(t.id) && !config.deletedTeachers?.includes(t.name));
      if(!profile)return Response.json({success:false,error:'teacher_removed'},{status:401});
      body.teacherName=profile.name;
    }
    if (['register','teacher_login','admin_login','admin_change_credentials'].includes(action)) {
      const allowed=await db('rpc/support_check_rate','POST',{p_key:district+'|'+action+'|'+String(body.rateKey||'unknown'),p_limit:action==='teacher_login'?10:6});
      if(!allowed)return Response.json({success:false,error:'rate_limited'},{status:429});
    }
    let result;
    if (action === 'admin_login' || action === 'admin_change_credentials') {
      const accounts=await db(`support_admin_accounts?district=eq.${district}`);
      const account=accounts[0],input=body.payload;
      const password=action==='admin_login'?input.password:input.currentPassword;
      const login=String(input.login||'').trim().toLowerCase();
      if(!account || !password || await sha256(String(password).trim())!==account.password_hash
        || (action==='admin_login' && ![account.login,district,'admin','zinnur'].includes(login))) result={success:false,error:'invalid_credentials'};
      else {
        if(action==='admin_change_credentials'){
          const newLogin=String(input.newLogin||'').trim().toLowerCase(),newPassword=String(input.newPassword||'').trim();
          if(!newLogin||newLogin.length>80||newPassword.length<8)return Response.json({success:false,error:'invalid_credentials'},{status:400});
          await db(`support_admin_accounts?district=eq.${district}`,'PATCH',{login:newLogin,password_hash:await sha256(newPassword)});
          account.login=newLogin;
        }
        result={success:true,login:account.login,district,role:account.role};
      }
    }
    else if (action === 'public_config') result = { config: publicSettings(config) };
    else if (action === 'register') { result = await register(district,body.payload,config); if(result.success) backgroundSync(token); }
    else if (action === 'get_config' || action === 'get_bookings') {
      const rows = await bookings(district,body.teacherName || null);
      result = action === 'get_bookings' ? rows.map(panelBooking) : {
        status:'ok', district, config:body.teacherName ? publicSettings(config) : config,
        teachers:body.teacherName ? (config.teachers || []).map(safeTeacher) : config.teachers,
        courses:config.courses, bookings:rows.map(panelBooking), holidays:config.holidayDates || []
      };
    } else if (action === 'teacher_login') {
      const digits = value => String(value||'').replace(/\D/g,'');
      const login = String(body.payload.login || '').trim().toLowerCase();
      if (!login || !/^\d{4,8}$/.test(String(body.payload.pin||''))) return Response.json({success:false,error:'invalid_credentials'},{status:401});
      const teacher = (config.teachers || []).find(t => String(t.pin || '') === String(body.payload.pin || '')
        && ((digits(login).length >= 7 && [t.phone,t.login].some(v => digits(v).slice(-9) === digits(login).slice(-9)))
          || [t.login,t.name].some(v => String(v||'').trim().toLowerCase() === login))
        && !config.deletedTeachers?.includes(t.id) && !config.deletedTeachers?.includes(t.name));
      result = teacher ? {success:true,teacher:{...safeTeacher(teacher),phone:teacher.phone,login:teacher.login}} : {success:false,error:'invalid_credentials'};
    } else if (action === 'availability' || action === 'ustozalar') {
      const course = body.payload.kurs;
      const courseConfig = getCourse(config,course);
      if (!courseConfig) return Response.json({success:false,error:'unknown_course'},{status:400});
      const capacity = Number(courseConfig.capacity) || 4;
      const teachers = (config.teachers || []).filter(t => (t.courses || []).includes(course) && !config.deletedTeachers?.includes(t.id) && !config.deletedTeachers?.includes(t.name));
      const teacherNames = new Set(teachers.map(t=>t.name));
      const rows = (await bookings(district,null,teachers.length ? null : course)).filter(r => !['Bekor qilingan','cancelled'].includes(r.status) && (!teachers.length || teacherNames.has(r.teacher)));
      if (action === 'ustozalar') {
        const date = parseDate(body.payload.sana);
        if(!date||!/^\d{2}:\d{2}$/.test(String(body.payload.vaqt||'')))return Response.json({success:false,error:'invalid_date'},{status:400});
        const counts = {};
        const selected = (await bookings(district,null,null,date?.iso)).filter(r => !['Bekor qilingan','cancelled'].includes(r.status) && r.lesson_time.slice(0,5) === body.payload.vaqt);
        for (const row of selected) if(row.teacher) counts[row.teacher] = (counts[row.teacher] || 0) + 1;
        result = {counts,capacity};
      } else {
        const map = {}, bySlot = {};
        for (const row of rows) {
          const b = row.payload;
          if (body.payload.oy && b.sana.slice(3) !== body.payload.oy) continue;
          const time = row.lesson_time.slice(0,5), key = b.sana+'|'+time;
          if(!bySlot[key]) bySlot[key]={date:b.sana,time,total:0,counts:{}};
          const slot=bySlot[key]; slot.total++; if(row.teacher)slot.counts[row.teacher]=(slot.counts[row.teacher]||0)+1;
        }
        for (const slot of Object.values(bySlot)) {
          if(!map[slot.date])map[slot.date]={};
          map[slot.date][slot.time]=teachers.length?fullTeacherCount(teachers,slot.counts,capacity,slot.date,slot.time):slot.total;
        }
        result=map;
      }
    } else if (action === 'save_config') {
      const next = {...body.payload.config, district};
      await db('rpc/support_save_settings','POST',{p_district:district,p_config:next});
      result={success:true,status:'ok',...next}; backgroundSync(token);
    } else if (action === 'update_status' || action === 'delete_booking') {
      result=await db('rpc/support_update_booking','POST',{p_district:district,p_id:body.payload.id,p_status:body.payload.status || 'Bekor qilingan',p_delete:action==='delete_booking'}); backgroundSync(token);
    } else if (action === 'teacher_state') {
      if(body.payload.data) {
        await db('support_teacher_state?on_conflict=district,teacher_id','POST',{district,teacher_id:body.teacherId,data:body.payload.data,updated_at:new Date().toISOString()},'resolution=merge-duplicates');
        result={success:true};
      } else result={success:true,data:(await db(`support_teacher_state?district=eq.${district}&teacher_id=eq.${eq(body.teacherId)}&select=data`))[0]?.data || {}};
    } else return Response.json({success:false,error:'unknown_action'},{status:400});
    return Response.json(result);
  } catch(error) {
    console.error('Support API:',error.message);
    return Response.json({success:false,error:'server_unavailable'},{status:503});
  }
});
