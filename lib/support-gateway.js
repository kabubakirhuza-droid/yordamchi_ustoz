import crypto from 'node:crypto';
export function supportEnabled() {
  return Boolean(process.env.SUPPORT_BACKEND_URL && process.env.SUPPORT_GATEWAY_TOKEN && process.env.SUPPORT_ANON_KEY);
}

export function requestRateKey(req) {
  const ip=String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  return crypto.createHash('sha256').update(ip + (process.env.SUPPORT_GATEWAY_TOKEN || '')).digest('hex');
}

export async function supportCall(action, district, payload = {}, scope = {}) {
  if (!supportEnabled()) throw new Error('support_backend_not_configured');
  const response = await fetch(process.env.SUPPORT_BACKEND_URL, {
    method: 'POST', headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPPORT_ANON_KEY}`,
      'x-support-token': process.env.SUPPORT_GATEWAY_TOKEN
    }, body: JSON.stringify({ action, district, payload, ...scope }), signal: AbortSignal.timeout(12000)
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'support_unavailable');
    error.status = response.status;
    throw error;
  }
  return result;
}

export function requestDistrict(req, fallback = 'sergeli') {
  return req.query?.district === 'uchtepa' || req.headers?.['x-district'] === 'uchtepa' ? 'uchtepa'
    : req.query?.district === 'sergeli' || req.headers?.['x-district'] === 'sergeli' ? 'sergeli' : fallback;
}
