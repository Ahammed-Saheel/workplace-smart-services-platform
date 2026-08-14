import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { forgotPasswordSchema } from '@/lib/validation';
import { ok, zodFail, serverError } from '@/lib/api-response';
import { findUserByEmail, setResetToken } from '@/lib/repo/users';

// This MVP has no outbound email service, so instead of emailing a reset
// link we return it directly in the response and show it on-screen,
// clearly labeled as a demo flow. In production this would be emailed.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const { email } = parsed.data;
    const user = findUserByEmail(email);

    // Always respond success to avoid leaking which emails are registered.
    if (!user) {
      return ok({ sent: true, resetLink: null });
    }

    const token = randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    setResetToken(user.id, token, expiry);

    const resetLink = `/reset-password?token=${token}`;
    return ok({ sent: true, resetLink });
  } catch (err) {
    return serverError(err);
  }
}
