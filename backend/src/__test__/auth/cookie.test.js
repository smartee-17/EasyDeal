import express from 'express';
import request from 'supertest';
import {
  generateAccessToken,
  setAuthCookie,
  clearAuthCookie,
} from '../../api/library/token.js';

/* ============================================================
   AUTH COOKIE CONTRACT

   The real token library is deliberately NOT mocked here. Everything else
   in this suite mocks it, which is why no existing test looked at the
   actual Set-Cookie headers.

   The property under test is the one a logout depends on: the cookie that
   logout expires must be the same cookie login set. Browsers decide which
   stored cookie a Set-Cookie header overwrites by name, domain and path
   only, so a clearing cookie that differs on any of those leaves the real
   cookie in place and the user stays signed in despite a 200 response.
   ============================================================ */

const REMEMBER_ME_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_MS = 24 * 60 * 60 * 1000;

const app = express();
app.get('/set-remember', (req, res) => {
  setAuthCookie(res, generateAccessToken({ _id: 'u1' }, true), true);
  res.status(200).end();
});
app.get('/set-session', (req, res) => {
  setAuthCookie(res, generateAccessToken({ _id: 'u1' }, false), false);
  res.status(200).end();
});
app.get('/clear', (req, res) => {
  clearAuthCookie(res);
  res.status(200).end();
});

/** Splits a Set-Cookie header into its name and its lowercased attributes. */
function parseSetCookie(res) {
  const raw = res.headers['set-cookie'];
  expect(raw).toBeDefined();
  const [pair, ...rest] = (Array.isArray(raw) ? raw[0] : raw).split(';');
  const name = pair.split('=')[0].trim();

  const attrs = {};
  for (const part of rest) {
    const [key, value] = part.trim().split('=');
    attrs[key.toLowerCase()] = value === undefined ? true : value;
  }
  return { name, attrs, raw: Array.isArray(raw) ? raw[0] : raw };
}

const setRemember = async () => parseSetCookie(await request(app).get('/set-remember'));
const setSession = async () => parseSetCookie(await request(app).get('/set-session'));
const clear = async () => parseSetCookie(await request(app).get('/clear'));

describe('auth cookie set/clear contract', () => {
  test('login issues an HttpOnly cookie that the browser script cannot read', async () => {
    const { attrs } = await setRemember();
    expect(attrs.httponly).toBe(true);
  });

  test('the cookie is scoped to the whole site, not just the issuing path', async () => {
    // Express defaults Path to '/', but an explicit value keeps a future
    // refactor from silently narrowing the cookie to one directory.
    const { attrs } = await setRemember();
    expect(attrs.path).toBe('/');
  });

  test('Remember Me unchecked issues a one-day cookie', async () => {
    const { attrs } = await setSession();
    expect(Number(attrs['max-age']) * 1000).toBe(SESSION_MS);
  });

  test('Remember Me checked issues a thirty-day cookie', async () => {
    const { attrs } = await setRemember();
    expect(Number(attrs['max-age']) * 1000).toBe(REMEMBER_ME_MS);
  });

  test('the token itself expires on the same schedule as its cookie', async () => {
    // A cookie outliving its token would keep being sent only to be
    // rejected, so the two durations must not drift apart.
    const oneDay = generateAccessToken({ _id: 'u1' }, false);
    const thirtyDays = generateAccessToken({ _id: 'u1' }, true);

    const lifetime = (token) => {
      const { exp, iat } = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
      );
      return (exp - iat) * 1000;
    };

    expect(lifetime(oneDay)).toBe(SESSION_MS);
    expect(lifetime(thirtyDays)).toBe(REMEMBER_ME_MS);
  });

  test('logout expires a cookie the browser will actually match', async () => {
    const set = await setRemember();
    const cleared = await clear();

    // Name, domain and path are what decide which stored cookie is replaced.
    expect(cleared.name).toBe(set.name);
    expect(cleared.attrs.path ?? '/').toBe(set.attrs.path ?? '/');
    expect(cleared.attrs.domain).toBe(set.attrs.domain);
  });

  test('the clearing cookie is already expired', async () => {
    const { attrs } = await clear();
    const expired =
      attrs['max-age'] !== undefined
        ? Number(attrs['max-age']) <= 0
        : new Date(attrs.expires) <= new Date();
    expect(expired).toBe(true);
  });

  test('logout reproduces the security attributes the cookie was set with', async () => {
    const set = await setRemember();
    const cleared = await clear();

    expect(cleared.attrs.httponly).toBe(true);
    expect(cleared.attrs.samesite).toBe(set.attrs.samesite);
    expect(Boolean(cleared.attrs.secure)).toBe(Boolean(set.attrs.secure));
  });
});