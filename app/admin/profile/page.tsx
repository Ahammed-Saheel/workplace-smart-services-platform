import { getSession } from '@/lib/auth';
import { findPublicUserById } from '@/lib/repo/users';
import { db } from '@/lib/db';
import { ProfileForm } from '@/components/shared/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getSession();
  const user = findPublicUserById(session!.sub)!;

  let workplace: { name: string; location: string } | null = null;
  if (user.workplaceId) {
    workplace = (db
      .prepare('SELECT name, location FROM Workplace WHERE id = ?')
      .get(user.workplaceId) as { name: string; location: string } | undefined) ?? null;
  }

  return <ProfileForm user={{ ...user, workplace }} />;
}
