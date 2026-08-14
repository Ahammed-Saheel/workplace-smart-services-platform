import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signSession, verifySessionToken } from '@/lib/auth';

describe('password hashing', () => {
  it('hashes a password and verifies the correct password against it', async () => {
    const hash = await hashPassword('Demo@1234');
    expect(hash).not.toBe('Demo@1234');
    expect(await verifyPassword('Demo@1234', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Demo@1234');
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });
});

describe('session tokens', () => {
  it('signs and verifies a valid session round-trip', async () => {
    const payload = { sub: 'user_123', role: 'EMPLOYEE' as const, name: 'John Jr', email: 'john@demo.com' };
    const token = await signSession(payload);
    const verified = await verifySessionToken(token);
    expect(verified).toEqual(payload);
  });

  it('rejects a garbage token', async () => {
    const verified = await verifySessionToken('not-a-real-token');
    expect(verified).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = await signSession({ sub: 'user_123', role: 'EMPLOYEE', name: 'John Jr', email: 'john@demo.com' });
    const tampered = token.slice(0, -2) + 'xx';
    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });
});
