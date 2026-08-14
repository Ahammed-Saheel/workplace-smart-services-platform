import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, message, details },
    { status }
  );
}

export function unauthorized(message = 'Please sign in to continue.') {
  return fail(message, 401);
}

export function forbidden(
  message = "You don't have permission to do that."
) {
  return fail(message, 403);
}

export function notFound(message = 'We could not find what you were looking for.') {
  return fail(message, 404);
}

export function zodFail(error: ZodError) {
  const message = error.issues[0]?.message ?? 'The information provided is invalid.';
  return fail(message, 422, error.flatten());
}

export function serverError(err: unknown) {
  console.error('[API ERROR]', err);
  return fail(
    'Something went wrong on our end. Please try again in a moment.',
    500
  );
}
