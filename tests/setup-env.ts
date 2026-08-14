process.env.JWT_SECRET ??= 'test-only-secret-for-vitest-not-for-production-use';
process.env.DATABASE_URL = 'file:./test.db';
