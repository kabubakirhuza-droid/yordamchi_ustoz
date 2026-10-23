const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync('api/sync.js', 'utf8')
  .replace("import { verifyToken } from './auth.js';", 'const verifyToken = () => null;')
  .replace("import { supportCall, supportEnabled, requestRateKey } from '../lib/support-gateway.js';", 'const supportEnabled = () => false;')
  .replace('export default async function handler', 'async function handler');
async function request(method, action, upstream) {
  let calledUrl;
  const ctx = vm.createContext({ AbortController, setTimeout, clearTimeout,
    fetch: async (url) => { calledUrl = url; return upstream; } });
  vm.runInContext(source, ctx);
  const req = { method, headers: {}, query: { action }, body: { action } };
  const res = { code: 200, setHeader() {}, status(n) { this.code = n; return this; }, json(data) { this.data = data; return this; } };
  await ctx.handler(req, res);
  return { res, calledUrl };
}
(async () => {
  for (const action of ['availability', 'ustozalar', 'get_bookings']) {
    const { res, calledUrl } = await request('GET', action, { ok: true, text: async () => '{"test":1}' });
    assert.equal(new URL(calledUrl).searchParams.get('action'), action);
    assert.equal(res.data.test, 1);
  }
  for (const upstream of [
    { ok: true, text: async () => '<html>Login required</html>' },
    { ok: false, text: async () => '{"success":true}' },
    { ok: true, text: async () => '{}' }
  ]) {
    const { res } = await request('POST', 'register', upstream);
    assert.equal(res.code, 502);
    assert.equal(res.data.success, false);
  }
  for (const success of [true, false]) {
    const { res } = await request('POST', 'register', { ok: true, text: async () => JSON.stringify({ success, bookingId: 'B-test' }) });
    assert.equal(res.data.success, success);
  }
  const { res } = await request('GET', 'availability', { ok: false });
  assert.equal(res.code, 502);
  console.log('9 proxy regression checks passed');
})();
