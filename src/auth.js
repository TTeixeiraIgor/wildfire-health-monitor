import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createAuthUser, findAuthUserByEmail, findAuthUserById, touchAuthUserLogin } from './db.js';

const SESSION_COOKIE = 'wildfire_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const PASSWORD_MIN_LENGTH = 8;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured.');
  }
  return new TextEncoder().encode(secret);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(Date.now() + SESSION_TTL_MS)
  };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLoginAt: user.last_login_at
  };
}

async function signSessionToken(user) {
  return new SignJWT({
    email: user.email,
    fullName: user.full_name
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${Math.floor(SESSION_TTL_MS / 1000)}s`)
    .sign(getAuthSecret());
}

async function verifySessionToken(token) {
  const { payload } = await jwtVerify(token, getAuthSecret(), {
    algorithms: ['HS256']
  });

  return payload;
}

export function validateSignupPayload(payload) {
  const fullName = payload.fullName?.trim() || '';
  const email = normalizeEmail(payload.email || '');
  const password = payload.password || '';
  const confirmPassword = payload.confirmPassword || '';

  if (fullName.length < 3) {
    return { ok: false, message: 'Informe um nome com pelo menos 3 caracteres.' };
  }

  if (!email || !email.includes('@')) {
    return { ok: false, message: 'Informe um e-mail valido.' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: 'As senhas informadas nao conferem.' };
  }

  return {
    ok: true,
    value: {
      fullName,
      email,
      password
    }
  };
}

export function validateSigninPayload(payload) {
  const email = normalizeEmail(payload.email || '');
  const password = payload.password || '';

  if (!email || !email.includes('@')) {
    return { ok: false, message: 'Informe um e-mail valido.' };
  }

  if (!password) {
    return { ok: false, message: 'Informe sua senha para continuar.' };
  }

  return {
    ok: true,
    value: { email, password }
  };
}

export async function registerUser({ fullName, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createAuthUser({ fullName, email, passwordHash });
  return sanitizeUser(user);
}

export async function authenticateUser({ email, password }) {
  const user = await findAuthUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return null;
  }

  const touchedUser = await touchAuthUserLogin(user.id);
  return sanitizeUser(touchedUser || user);
}

export async function createSession(user) {
  const fullUser = await findAuthUserById(user.id);
  const token = await signSessionToken(fullUser);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getCookieOptions());
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    ...getCookieOptions(),
    expires: new Date(0)
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) {
      return null;
    }

    const user = await findAuthUserById(userId);
    return sanitizeUser(user);
  } catch {
    return null;
  }
}
