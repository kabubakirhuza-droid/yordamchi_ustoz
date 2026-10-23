// Public booking settings: no student history or teacher credentials.
import { supportCall, supportEnabled } from '../lib/support-gateway.js';
const SCRIPT_URLS = {
  sergeli: 'https://script.google.com/macros/s/AKfycbzk8hu77h_nGcUpnqe9aAPHtxX8LQrH4inmRkt1igiusHfcofkl0YeEniLsioYaBDc1/exec',
  uchtepa: 'https://script.google.com/macros/s/AKfycbyCiT0-u7NqvJ9AYxyA-bO8hPVNdV4ef9A3vtgQPLKHuU6KwOHsZeK-8WTEpt2QT2jf_Q/exec'
};
const cache = new Map();
const inFlight = new Map();

export function publicConfig(source) {
  const config = source.config || source;
  const fields = ['courses', 'courseTeachers', 'teacherSchedule', 'deletedTeachers', 'deletedCourses', 'holidayDates', 'courseExcludedDays'];
  const safe = {};
  for (const field of fields) if (config[field] !== undefined) safe[field] = config[field];
  safe.teachers = (config.teachers || source.teachers || []).map(teacher => {
    const safeTeacher = {};
    for (const field of ['id', 'name', 'courses', 'startTime', 'endTime', 'daysOff', 'dailyHours']) {
      if (teacher[field] !== undefined) safeTeacher[field] = teacher[field];
    }
    return safeTeacher;
  });
  return safe;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false });
  const district = req.query.district === 'uchtepa' ? 'uchtepa' : 'sergeli';
  let cached = cache.get(district);
  let pending = inFlight.get(district);
  try {
    if (!cached || Date.now() - cached.time > 60000) {
      if (!pending) pending = (async () => {
        if (supportEnabled()) {
          const result = await supportCall('public_config',district);
          cached = {time:Date.now(),value:result.config};
          cache.set(district,cached);
          return;
        }
        const response = await fetch(`${SCRIPT_URLS[district]}?action=get_config`, { signal: AbortSignal.timeout(6000) });
        if (!response.ok) throw new Error('config_unavailable');
        const source = await response.json();
        if (source.error || !source.courses) throw new Error('config_unavailable');
        cached = { time: Date.now(), value: publicConfig(source) };
        cache.set(district, cached);
      })().finally(() => { inFlight.delete(district); });
      inFlight.set(district, pending);
      await pending;
      cached = cache.get(district);
    }
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ config: cached.value });
  } catch {
    if (cached) return res.status(200).json({ config: cached.value, stale: true });
    return res.status(503).json({ success: false, error: 'config_unavailable' });
  }
}
