// Vercel Serverless Function: /api/sync
import { verifyToken } from './auth.js';
import { supportCall, supportEnabled, requestRateKey } from '../lib/support-gateway.js';

const SCRIPT_URLS = {
  sergeli: "https://script.google.com/macros/s/AKfycbzk8hu77h_nGcUpnqe9aAPHtxX8LQrH4inmRkt1igiusHfcofkl0YeEniLsioYaBDc1/exec",
  uchtepa: "https://script.google.com/macros/s/AKfycbyCiT0-u7NqvJ9AYxyA-bO8hPVNdV4ef9A3vtgQPLKHuU6KwOHsZeK-8WTEpt2QT2jf_Q/exec"
};

// In-memory cache across serverless warm invocations
const DISTRICT_CACHE = {
  sergeli: null,
  uchtepa: null
};

// Default courses
const DEFAULT_COURSES = {
  uchtepa: [
    { id: "c1", name: "Arab tili - Harf", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c2", name: "Arab tili - Qoida", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c3", name: "Arab tili - Amaliyot", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c4", name: "Arab tili grammatikasi", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c5", name: "Ingliz tili", startTime: "09:00", endTime: "12:00", slotDuration: 30, capacity: 1, active: true },
    { id: "c6", name: "Nurli Bolajon", startTime: "13:00", endTime: "17:00", slotDuration: 30, capacity: 1, active: true },
    { id: "c7", name: "Arab tili - Fonetika", startTime: "08:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true }
  ],
  sergeli: [
    { id: "c1", name: "Arab tili - Harf", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c2", name: "Arab tili - Qoida", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c3", name: "Arab tili - Amaliyot", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c4", name: "Arab tili grammatikasi", startTime: "09:00", endTime: "17:00", slotDuration: 30, capacity: 4, active: true },
    { id: "c5", name: "Ingliz tili", startTime: "09:00", endTime: "12:00", slotDuration: 30, capacity: 1, active: true },
    { id: "c6", name: "Nurli Bolajon", startTime: "13:00", endTime: "17:00", slotDuration: 30, capacity: 1, active: true }
  ]
};

// Default initial teachers (aligned with live Google Sheets database)
const DEFAULT_TEACHERS = {
  sergeli: [
    {
      id: "t_1790852387410",
      name: "Feruza ustoza",
      phone: "+998 99 999 99 99",
      login: "+998 99 999 99 99",
      pin: '',
      courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"],
      startTime: "13:00",
      endTime: "17:00",
      daysOff: [0],
      dailyHours: {
        "0": { "isWork": false, "start": "09:00", "end": "17:00" },
        "1": { "isWork": true, "start": "13:00", "end": "17:00" },
        "2": { "isWork": true, "start": "13:00", "end": "17:00" },
        "3": { "isWork": true, "start": "13:00", "end": "17:00" },
        "4": { "isWork": true, "start": "13:00", "end": "17:00" },
        "5": { "isWork": true, "start": "13:00", "end": "17:00" },
        "6": { "isWork": true, "start": "13:00", "end": "17:00" }
      }
    },
    {
      id: "t_1790859927339",
      name: "Xadicha Ustoza",
      phone: "+998 11 111 11 1",
      login: "+998 11 111 11 1",
      pin: '',
      courses: ["Arab tili - Harf", "Arab tili - Qoida", "Arab tili - Amaliyot"],
      startTime: "09:00",
      endTime: "17:00",
      daysOff: [6],
      dailyHours: {
        "0": { "isWork": true, "start": "09:00", "end": "17:00" },
        "1": { "isWork": true, "start": "13:00", "end": "17:00" },
        "2": { "isWork": true, "start": "09:00", "end": "17:00" },
        "3": { "isWork": true, "start": "13:00", "end": "17:00" },
        "4": { "isWork": true, "start": "09:00", "end": "17:00" },
        "5": { "isWork": true, "start": "13:00", "end": "17:00" },
        "6": { "isWork": false, "start": "09:00", "end": "17:00" }
      }
    }
  ],
  uchtepa: [
    {
      id: "t_1790940388871",
      name: "Sarvara",
      login: "+998 90 123 45 67",
      phone: "+998 90 123 45 67",
      pin: '',
      courses: ["Nurli Bolajon"],
      startTime: "14:00",
      endTime: "17:00",
      daysOff: [6, 0],
      dailyHours: {
        "0": { "isWork": false, "start": "09:00", "end": "17:00" },
        "1": { "isWork": true, "start": "14:00", "end": "17:00" },
        "2": { "isWork": true, "start": "14:00", "end": "17:00" },
        "3": { "isWork": true, "start": "14:00", "end": "17:00" },
        "4": { "isWork": true, "start": "14:00", "end": "17:00" },
        "5": { "isWork": true, "start": "14:00", "end": "17:00" },
        "6": { "isWork": false, "start": "14:00", "end": "17:00" }
      }
    },
    {
      id: "t_1790940541826",
      name: "Mahbuba U",
      login: "+998 91 234 56 78",
      phone: "+998 91 234 56 78",
      pin: '',
      courses: ["Arab tili grammatikasi", "Arab tili - Fonetika"],
      startTime: "08:00",
      endTime: "17:00",
      daysOff: [],
      dailyHours: {
        "0": { "isWork": true, "start": "08:00", "end": "17:00" },
        "1": { "isWork": true, "start": "09:00", "end": "17:00" },
        "2": { "isWork": true, "start": "14:00", "end": "17:00" },
        "3": { "isWork": true, "start": "14:00", "end": "17:00" },
        "4": { "isWork": true, "start": "14:00", "end": "17:00" },
        "5": { "isWork": true, "start": "14:00", "end": "17:00" },
        "6": { "isWork": true, "start": "14:00", "end": "17:00" }
      }
    },
    {
      id: "t_1791121070983",
      name: "Fotima U",
      login: "+998 93 345 67 89",
      phone: "+998 93 345 67 89",
      pin: '',
      courses: ["Arab tili - Fonetika"],
      startTime: "08:00",
      endTime: "12:00",
      daysOff: [0],
      dailyHours: {
        "0": { "isWork": false, "start": "09:00", "end": "17:00" },
        "1": { "isWork": true, "start": "08:00", "end": "12:00" },
        "2": { "isWork": true, "start": "08:00", "end": "12:00" },
        "3": { "isWork": true, "start": "08:00", "end": "12:00" },
        "4": { "isWork": true, "start": "08:00", "end": "12:00" },
        "5": { "isWork": true, "start": "08:00", "end": "12:00" },
        "6": { "isWork": true, "start": "08:00", "end": "12:00" }
      }
    },
    {
      id: "t_1791121123092",
      name: "Munira U",
      login: "+998 94 456 78 90",
      phone: "+998 94 456 78 90",
      pin: '',
      courses: ["Arab tili grammatikasi", "Arab tili - Fonetika"],
      startTime: "08:00",
      endTime: "17:00",
      daysOff: [],
      dailyHours: {
        "0": { "isWork": true, "start": "08:00", "end": "17:00" },
        "1": { "isWork": true, "start": "08:00", "end": "17:00" },
        "2": { "isWork": true, "start": "14:00", "end": "17:00" },
        "3": { "isWork": true, "start": "08:00", "end": "17:00" },
        "4": { "isWork": true, "start": "14:00", "end": "17:00" },
        "5": { "isWork": true, "start": "08:00", "end": "17:00" },
        "6": { "isWork": true, "start": "14:00", "end": "17:00" }
      }
    },
    {
      id: "t_1791172129106",
      name: "Mumtoza begim",
      login: "+998 97 567 89 01",
      phone: "+998 97 567 89 01",
      pin: '',
      courses: ["Ingliz tili"],
      startTime: "14:00",
      endTime: "17:00",
      daysOff: [2, 4, 0],
      dailyHours: {
        "0": { "isWork": false, "start": "09:00", "end": "17:00" },
        "1": { "isWork": true, "start": "14:00", "end": "17:00" },
        "2": { "isWork": false, "start": "14:00", "end": "17:00" },
        "3": { "isWork": true, "start": "14:00", "end": "17:00" },
        "4": { "isWork": false, "start": "14:00", "end": "17:00" },
        "5": { "isWork": true, "start": "14:00", "end": "17:00" },
        "6": { "isWork": true, "start": "14:00", "end": "17:00" }
      }
    }
  ]
};

function cleanDigits(val) {
  return String(val || '').replace(/\D/g, '');
}

function filterDeleted(teachers, deletedList) {
  if (!Array.isArray(teachers)) return [];
  if (!Array.isArray(deletedList) || deletedList.length === 0) return teachers;
  const delSet = new Set(deletedList.map(d => String(d || '').trim().toLowerCase()));
  return teachers.filter(t => {
    if (!t) return false;
    const id = String(t.id || '').trim().toLowerCase();
    const name = String(t.name || '').trim().toLowerCase();
    const digits = cleanDigits(t.phone || t.login);
    if (delSet.has(id) || delSet.has(name) || (digits && delSet.has(digits))) {
      return false;
    }
    return true;
  });
}

function filterDeletedCourses(courses, deletedList) {
  if (!Array.isArray(courses)) return [];
  if (!Array.isArray(deletedList) || deletedList.length === 0) return courses;
  const delSet = new Set(deletedList.map(d => String(d || '').trim().toLowerCase()));
  return courses.filter(c => {
    if (!c) return false;
    const id = String(c.id || '').trim().toLowerCase();
    const name = String(c.name || '').trim().toLowerCase();
    return !delSet.has(id) && !delSet.has(name);
  });
}

function computeCourseTeachersAndSchedule(teachers, allowedCourses = null) {
  const courseTeachers = {};
  const teacherSchedule = {};
  const allowedSet = Array.isArray(allowedCourses) && allowedCourses.length > 0
    ? new Set(allowedCourses.map(c => typeof c === 'string' ? c.trim().toLowerCase() : String(c.name || '').trim().toLowerCase()))
    : null;

  (teachers || []).forEach(t => {
    if (!t || !t.name) return;
    teacherSchedule[t.name] = {
      offDays: t.daysOff || [],
      start: t.startTime || "09:00",
      end: t.endTime || "17:00",
      dailyHours: t.dailyHours || null
    };
    (t.courses || []).forEach(cName => {
      if (!cName) return;
      if (allowedSet && !allowedSet.has(String(cName).trim().toLowerCase())) return;
      if (!courseTeachers[cName]) courseTeachers[cName] = [];
      if (!courseTeachers[cName].includes(t.name)) {
        courseTeachers[cName].push(t.name);
      }
    });
  });
  return { courseTeachers, teacherSchedule };
}

function getDistrict(req, defaultDistrict = 'sergeli') {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.substring(7));
    if (decoded && decoded.district) return decoded.district;
  }
  const hDistrict = req.headers['x-district'];
  if (hDistrict && (hDistrict === 'sergeli' || hDistrict === 'uchtepa')) return hDistrict;
  const qDistrict = req.query.district;
  if (qDistrict && (qDistrict === 'sergeli' || qDistrict === 'uchtepa')) return qDistrict;
  return defaultDistrict;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-district');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const district = getDistrict(req, 'sergeli');
  const explicitDistrict = req.query?.district || req.headers['x-district'];
  const districtToken = verifyToken((req.headers.authorization || '').replace(/^Bearer /,''));
  if (districtToken && explicitDistrict && districtToken.district !== explicitDistrict) return res.status(403).json({success:false,error:'district_mismatch'});
  const defaultScriptUrl = SCRIPT_URLS[district] || SCRIPT_URLS.sergeli;

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.substring(7));
    if (decoded && decoded.district && decoded.district !== district) {
      return res.status(403).json({
        success: false,
        message: `Ruxsat etilmadi: Siz faqat ${decoded.district.toUpperCase()} tumanini boshqarishingiz mumkin!`
      });
    }
  }

  try {
    if (supportEnabled()) {
      res.setHeader('Cache-Control','no-store');
      const action = req.method === 'GET' ? req.query.action || 'get_config'
        : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}).action;
      const payload = req.method === 'GET' ? req.query : typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const normalized = action === 'getConfig' ? 'get_config' : action === 'saveConfig' ? 'save_config' : action;
      if ((req.method === 'GET' && !['get_config','get_bookings','availability','ustozalar'].includes(normalized))
        || (req.method !== 'GET' && req.method !== 'POST')) return res.status(405).json({success:false,error:'method_not_allowed'});
      const publicAction = ['availability','ustozalar','register'].includes(normalized);
      const decoded = verifyToken((req.headers.authorization || '').replace(/^Bearer /,''));
      if (!publicAction && (!decoded || decoded.role === 'teacher' || decoded.district !== district)) {
        return res.status(401).json({success:false,error:'unauthorized'});
      }
      if (!['availability','ustozalar','register','get_config','get_bookings','save_config','delete_booking','update_status'].includes(normalized)) {
        return res.status(400).json({success:false,error:'unknown_action'});
      }
      return res.status(200).json(await supportCall(normalized,district,payload,{rateKey:requestRateKey(req)}));
    }
    if (req.method === 'GET') {
      const { action, kurs, sana, vaqt, oy, _t } = req.query;
      const gasAction = !action || action === 'getConfig' ? 'get_config' : action;

      let url = `${defaultScriptUrl}?action=${encodeURIComponent(gasAction)}`;
      if (kurs) url += `&kurs=${encodeURIComponent(kurs)}`;
      if (sana) url += `&sana=${encodeURIComponent(sana)}`;
      if (vaqt) url += `&vaqt=${encodeURIComponent(vaqt)}`;
      if (oy) url += `&oy=${encodeURIComponent(oy)}`;
      if (_t)   url += `&_t=${encodeURIComponent(_t)}`;

      const currentDeletedTeachers = DISTRICT_CACHE[district]?.deletedTeachers || [];
      const currentDeletedCourses  = DISTRICT_CACHE[district]?.deletedCourses  || [];

      // Try fetching from Google Apps Script (with 25s timeout and redirect follow)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const googleRes = await fetch(url, { signal: controller.signal, redirect: 'follow' });
        clearTimeout(timeout);
        if (googleRes.ok) {
          const text = await googleRes.text();
          if (text && (text.startsWith('{') || text.startsWith('['))) {
            const data = JSON.parse(text);
            if (gasAction !== 'get_config') return res.status(200).json(data);
            if (!data.error) {
              const remoteDelTeachers = Array.isArray(data.config?.deletedTeachers) ? data.config.deletedTeachers
                : Array.isArray(data.deletedTeachers) ? data.deletedTeachers
                : [];
              const allDelTeachers = Array.from(new Set([...currentDeletedTeachers, ...remoteDelTeachers]));

              const remoteDelCourses = Array.isArray(data.config?.deletedCourses) ? data.config.deletedCourses
                : Array.isArray(data.deletedCourses) ? data.deletedCourses
                : [];
              const allDelCourses = Array.from(new Set([...currentDeletedCourses, ...remoteDelCourses]));

              // Extract teachers: GAS returns teachers directly or inside config
              let rawTeachers = Array.isArray(data.teachers) ? data.teachers
                : Array.isArray(data.config?.teachers) ? data.config.teachers
                : null;

              let finalTeachers = [];
              if (rawTeachers !== null && rawTeachers.length > 0) {
                finalTeachers = filterDeleted(rawTeachers, allDelTeachers);
              } else if (DISTRICT_CACHE[district] && Array.isArray(DISTRICT_CACHE[district].teachers) && DISTRICT_CACHE[district].teachers.length > 0) {
                finalTeachers = filterDeleted(DISTRICT_CACHE[district].teachers, allDelTeachers);
              } else if (rawTeachers !== null) {
                finalTeachers = [];
              } else {
                finalTeachers = filterDeleted(DEFAULT_TEACHERS[district] || [], allDelTeachers);
              }

              // Extract courses & filter against deleted courses
              let rawCourses = data.courses || data.config?.courses || DISTRICT_CACHE[district]?.courses || DEFAULT_COURSES[district];
              let courses = filterDeletedCourses(rawCourses, allDelCourses);

              // Strip deleted courses from teachers' course assignments
              if (Array.isArray(finalTeachers) && allDelCourses.length > 0) {
                const delCourseSet = new Set(allDelCourses.map(c => String(c || '').trim().toLowerCase()));
                finalTeachers.forEach(t => {
                  if (Array.isArray(t.courses)) {
                    t.courses = t.courses.filter(cn => !delCourseSet.has(String(cn).trim().toLowerCase()));
                  }
                });
              }

              // Dynamically compute courseTeachers and teacherSchedule
              const { courseTeachers, teacherSchedule } = computeCourseTeachersAndSchedule(finalTeachers, courses);

              const unifiedConfig = {
                district,
                scriptUrl: defaultScriptUrl,
                courses,
                teachers: finalTeachers,
                deletedTeachers: allDelTeachers,
                deletedCourses: allDelCourses,
                courseTeachers,
                teacherSchedule,
                holidayDates: data.holidayDates || data.config?.holidayDates || DISTRICT_CACHE[district]?.holidays || []
              };

              DISTRICT_CACHE[district] = {
                status: 'ok',
                district,
                config: unifiedConfig,
                teachers: finalTeachers,
                courses,
                courseTeachers,
                teacherSchedule,
                deletedTeachers: allDelTeachers,
                deletedCourses: allDelCourses,
                bookings: data.bookings || DISTRICT_CACHE[district]?.bookings || [],
                holidays: data.holidays || data.holidayDates || DISTRICT_CACHE[district]?.holidays || [],
                lastUpdated: new Date().toISOString()
              };

              return res.status(200).json({
                status: 'ok',
                district,
                teachers: finalTeachers,
                courses,
                courseTeachers,
                teacherSchedule,
                deletedTeachers: allDelTeachers,
                deletedCourses: allDelCourses,
                bookings: DISTRICT_CACHE[district].bookings,
                holidays: DISTRICT_CACHE[district].holidays,
                config: unifiedConfig,
                _source: 'sheets'
              });
            }
          }
        }
      } catch(e) {
        // GAS unreachable — fall through to cache
      }

      if (gasAction !== 'get_config') {
        return res.status(502).json({ success: false, error: 'availability_unavailable' });
      }

      // If GAS fails or times out: return from DISTRICT_CACHE or defaults
      const allDelTeachers = DISTRICT_CACHE[district]?.deletedTeachers || [];
      const allDelCourses  = DISTRICT_CACHE[district]?.deletedCourses  || [];

      let finalTeachers = [];
      if (DISTRICT_CACHE[district] && Array.isArray(DISTRICT_CACHE[district].teachers)) {
        finalTeachers = filterDeleted(DISTRICT_CACHE[district].teachers, allDelTeachers);
      } else {
        finalTeachers = filterDeleted(DEFAULT_TEACHERS[district] || [], allDelTeachers);
      }

      const rawCourses = DISTRICT_CACHE[district]?.courses || DEFAULT_COURSES[district];
      const courses = filterDeletedCourses(rawCourses, allDelCourses);

      if (Array.isArray(finalTeachers) && allDelCourses.length > 0) {
        const delCourseSet = new Set(allDelCourses.map(c => String(c || '').trim().toLowerCase()));
        finalTeachers.forEach(t => {
          if (Array.isArray(t.courses)) {
            t.courses = t.courses.filter(cn => !delCourseSet.has(String(cn).trim().toLowerCase()));
          }
        });
      }

      const { courseTeachers, teacherSchedule } = computeCourseTeachersAndSchedule(finalTeachers, courses);
      const cachedBookings = DISTRICT_CACHE[district]?.bookings || [];
      const cachedHolidays = DISTRICT_CACHE[district]?.holidays || [];

      const unifiedConfig = {
        district,
        scriptUrl: defaultScriptUrl,
        courses,
        teachers: finalTeachers,
        deletedTeachers: allDelTeachers,
        deletedCourses: allDelCourses,
        courseTeachers,
        teacherSchedule,
        holidayDates: cachedHolidays
      };

      return res.status(200).json({
        status: 'ok',
        district,
        teachers: finalTeachers,
        courses,
        courseTeachers,
        teacherSchedule,
        deletedTeachers: allDelTeachers,
        deletedCourses: allDelCourses,
        bookings: cachedBookings,
        holidays: cachedHolidays,
        config: unifiedConfig,
        _source: DISTRICT_CACHE[district] ? 'cache' : 'default'
      });
    }

    if (req.method === 'POST') {
      const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // 1. If this is a student registration or booking action, proxy directly to Google Apps Script!
      if (bodyObj.action === 'register' || (bodyObj.ism && bodyObj.kurs && bodyObj.sana) || bodyObj.action === 'delete_booking' || bodyObj.action === 'update_status') {
        const targetUrl = defaultScriptUrl;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        try {
          const googleRes = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj),
            signal: controller.signal,
            redirect: 'follow'
          });
          clearTimeout(timeout);
          const text = await googleRes.text();
          if (!googleRes.ok) return res.status(502).json({ success: false, error: 'upstream_http_error' });
          try {
            const parsed = JSON.parse(text);
            if (typeof parsed?.success !== 'boolean') return res.status(502).json({ success: false, error: 'invalid_backend_response' });
            return res.status(200).json(parsed);
          } catch(e) {
            return res.status(502).json({ success: false, error: 'invalid_backend_response' });
          }
        } catch(err) {
          clearTimeout(timeout);
          return res.status(500).json({ success: false, error: String(err) });
        }
      }

      const configData = bodyObj.config || bodyObj;

      // Extract deletedTeachers list
      const incomingDeletedTeachers = Array.isArray(configData.deletedTeachers)
        ? configData.deletedTeachers
        : Array.isArray(bodyObj.deletedTeachers)
          ? bodyObj.deletedTeachers
          : [];
      const currentDeletedTeachers = DISTRICT_CACHE[district]?.deletedTeachers || [];
      const deletedTeachers = Array.from(new Set([...currentDeletedTeachers, ...incomingDeletedTeachers]));

      // Extract deletedCourses list
      const incomingDeletedCourses = Array.isArray(configData.deletedCourses)
        ? configData.deletedCourses
        : Array.isArray(bodyObj.deletedCourses)
          ? bodyObj.deletedCourses
          : [];
      const currentDeletedCourses = DISTRICT_CACHE[district]?.deletedCourses || [];
      const deletedCourses = Array.from(new Set([...currentDeletedCourses, ...incomingDeletedCourses]));

      // Extract teachers from config or top-level body
      let rawTeachers = null;
      if (Array.isArray(configData.teachers)) {
        rawTeachers = configData.teachers;
      } else if (Array.isArray(bodyObj.teachers)) {
        rawTeachers = bodyObj.teachers;
      }

      let teachers = [];
      if (rawTeachers !== null) {
        teachers = filterDeleted(rawTeachers, deletedTeachers);
      } else if (DISTRICT_CACHE[district]?.teachers) {
        teachers = filterDeleted(DISTRICT_CACHE[district].teachers, deletedTeachers);
      }

      // Extract courses and filter against deletedCourses
      const rawCourses = configData.courses || bodyObj.courses || DISTRICT_CACHE[district]?.courses || DEFAULT_COURSES[district];
      const courses = filterDeletedCourses(rawCourses, deletedCourses);

      // Strip deleted courses from teachers
      if (Array.isArray(teachers) && deletedCourses.length > 0) {
        const delCourseSet = new Set(deletedCourses.map(c => String(c || '').trim().toLowerCase()));
        teachers.forEach(t => {
          if (Array.isArray(t.courses)) {
            t.courses = t.courses.filter(cn => !delCourseSet.has(String(cn).trim().toLowerCase()));
          }
        });
      }

      const { courseTeachers, teacherSchedule } = computeCourseTeachersAndSchedule(teachers, courses);
      const bookings = bodyObj.bookings || configData.bookings || (DISTRICT_CACHE[district]?.bookings || []);
      const holidays = bodyObj.holidays || bodyObj.holidayDates || configData.holidays || (DISTRICT_CACHE[district]?.holidays || []);

      const unifiedConfig = {
        ...configData,
        district,
        teachers,
        courses,
        courseTeachers,
        teacherSchedule,
        deletedTeachers,
        deletedCourses,
        holidayDates: holidays
      };

      DISTRICT_CACHE[district] = {
        status: 'ok',
        district,
        config: unifiedConfig,
        teachers,
        courses,
        courseTeachers,
        teacherSchedule,
        deletedTeachers,
        deletedCourses,
        bookings,
        holidays,
        lastUpdated: new Date().toISOString()
      };

      // Prepare payload for Google Apps Script with fully populated courseTeachers & teacherSchedule!
      const gasPayload = {
        action: "save_config",
        district,
        config: unifiedConfig,
        bookings,
        holidays
      };

      try {
        const targetUrl = (configData.scriptUrl) || defaultScriptUrl;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const googleRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gasPayload),
          signal: controller.signal,
          redirect: 'follow'
        });
        clearTimeout(timeout);
        if (googleRes.ok) {
          const text = await googleRes.text();
          if (text && (text.startsWith('{') || text.startsWith('['))) {
            const data = JSON.parse(text);
            return res.status(200).json({
              status: 'ok',
              success: true,
              district,
              message: `${district.toUpperCase()} ma'lumotlari saqlandi!`,
              teachers,
              courses,
              courseTeachers,
              teacherSchedule,
              deletedTeachers,
              deletedCourses,
              gasResponse: data
            });
          }
        }
      } catch (e) {
        // GAS error or timeout
      }

      return res.status(200).json({
        status: 'ok',
        success: true,
        district,
        message: `${district.toUpperCase()} ma'lumotlari saqlandi!`,
        teachers,
        courses,
        courseTeachers,
        teacherSchedule,
        deletedTeachers,
        deletedCourses,
        data: DISTRICT_CACHE[district]
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    if (supportEnabled()) return res.status(err.status===429?429:503).json({success:false,error:err.status===429?'rate_limited':'server_unavailable'});
    if (DISTRICT_CACHE[district]) return res.status(200).json(DISTRICT_CACHE[district]);
    return res.status(500).json({ success: false, district, error: err.message });
  }
}
