// Vercel Serverless Function: /api/config
import { verifyToken } from './auth.js';

const SCRIPT_URLS = {
  sergeli: "https://script.google.com/macros/s/AKfycbzk8hu77h_nGcUpnqe9aAPHtxX8LQrH4inmRkt1igiusHfcofkl0YeEniLsioYaBDc1/exec",
  uchtepa: "https://script.google.com/macros/s/AKfycbyCiT0-u7NqvJ9AYxyA-bO8hPVNdV4ef9A3vtgQPLKHuU6KwOHsZeK-8WTEpt2QT2jf_Q/exec"
};

const DISTRICT_CACHE = {
  sergeli: null,
  uchtepa: null
};

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-district');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const district = getDistrict(req, 'sergeli');
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
    if (req.method === 'GET') {
      if (DISTRICT_CACHE[district] && DISTRICT_CACHE[district].config) {
        return res.status(200).json({ status: 'ok', district, ...DISTRICT_CACHE[district] });
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const action = district === 'sergeli' ? 'get_config' : 'getConfig';
        const googleRes = await fetch(`${defaultScriptUrl}?action=${action}`, { signal: controller.signal });
        clearTimeout(timeout);
        const text = await googleRes.text();
        if (text && (text.startsWith('{') || text.startsWith('['))) {
          const data = JSON.parse(text);
          if (data) {
            DISTRICT_CACHE[district] = {
              status: 'ok',
              district,
              config: data.config || data,
              bookings: data.bookings || [],
              holidays: data.holidays || data.holidayDates || []
            };
            return res.status(200).json(DISTRICT_CACHE[district]);
          }
        }
      } catch (e) {}

      if (DISTRICT_CACHE[district]) {
        return res.status(200).json(DISTRICT_CACHE[district]);
      }

      return res.status(200).json({ status: 'ok', district, config: null, bookings: [], holidays: [] });
    }

    if (req.method === 'POST') {
      const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      DISTRICT_CACHE[district] = {
        status: 'ok',
        district,
        config: bodyObj.config || bodyObj,
        bookings: bodyObj.bookings || (DISTRICT_CACHE[district]?.bookings || []),
        holidays: bodyObj.holidays || bodyObj.holidayDates || (DISTRICT_CACHE[district]?.holidays || []),
        lastUpdated: new Date().toISOString()
      };

      try {
        const targetUrl = (bodyObj.config && bodyObj.config.scriptUrl) || defaultScriptUrl;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj),
          signal: controller.signal
        }).catch(() => {});
        clearTimeout(timeout);
      } catch (e) {}

      return res.status(200).json({
        success: true,
        district,
        message: `${district.toUpperCase()} ma'lumotlari muvaffaqiyatli saqlandi!`,
        data: DISTRICT_CACHE[district]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (DISTRICT_CACHE[district]) return res.status(200).json(DISTRICT_CACHE[district]);
    return res.status(500).json({ status: 'error', district, error: err.message });
  }
}
