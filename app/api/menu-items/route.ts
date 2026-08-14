import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { menuItemSchema } from '@/lib/validation';
import { created, ok, unauthorized, forbidden, zodFail, serverError, notFound } from '@/lib/api-response';
import { logActivity } from '@/lib/notifications';
import { listMenuItems, createMenuItem } from '@/lib/repo/menu-items';
import { findCafeteriaByOwnerId } from '@/lib/repo/cafeterias';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const items = listMenuItems({
      cafeteriaId: searchParams.get('cafeteriaId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    return ok({ items });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'CAFETERIA_OWNER') return forbidden();

    const body = await req.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    const cafeteria = findCafeteriaByOwnerId(session.sub);
    if (!cafeteria) return notFound('You do not manage a cafeteria yet.');

    const item = createMenuItem({ ...parsed.data, cafeteriaId: cafeteria.id });

    await logActivity(session.sub, 'Menu item created', 'MenuItem', item.id);
    return created({ item });
  } catch (err) {
    return serverError(err);
  }
}
