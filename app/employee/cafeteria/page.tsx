import { PageHeader } from '@/components/layout/page-header';
import { CafeteriaSwitcher } from '@/components/employee/cafeteria-switcher';
import { listCafeterias } from '@/lib/repo/cafeterias';
import { listMenuItems } from '@/lib/repo/menu-items';

export const dynamic = 'force-dynamic';

export default function EmployeeCafeteriaPage() {
  const cafeterias = listCafeterias();

  const cafeteriaViews = cafeterias.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    items: listMenuItems({ cafeteriaId: c.id }),
  }));

  return (
    <div>
      <PageHeader
        title="Cafeteria"
        description="Access food and workplace services inside your campus without walking over to check."
      />
      <CafeteriaSwitcher cafeterias={cafeteriaViews} />
    </div>
  );
}
