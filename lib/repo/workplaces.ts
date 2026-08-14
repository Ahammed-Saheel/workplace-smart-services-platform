import { db } from '@/lib/db';
import type { WorkplaceRow } from '@/types/db';

export function getDefaultWorkplace(): WorkplaceRow | undefined {
  return db.prepare('SELECT * FROM Workplace WHERE active = 1 LIMIT 1').get() as
    | WorkplaceRow
    | undefined;
}
