import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, ChefHat, PackageCheck, XCircle, CircleDot, Sparkles, Ban } from 'lucide-react';

const ORDER_MAP: Record<string, { label: string; tone: 'neutral' | 'amber' | 'teal' | 'green' | 'red' | 'blue'; icon: React.ElementType }> = {
  PLACED: { label: 'Placed', tone: 'blue', icon: Clock },
  ACCEPTED: { label: 'Accepted', tone: 'amber', icon: CheckCircle2 },
  PREPARING: { label: 'Preparing', tone: 'amber', icon: ChefHat },
  READY: { label: 'Ready for pickup', tone: 'green', icon: Sparkles },
  COMPLETED: { label: 'Completed', tone: 'neutral', icon: PackageCheck },
  CANCELLED: { label: 'Cancelled', tone: 'red', icon: XCircle },
  SUBMITTED: { label: 'Submitted', tone: 'blue', icon: Clock },
  UNDER_REVIEW: { label: 'Under review', tone: 'amber', icon: CircleDot },
  PLANNED: { label: 'Planned', tone: 'teal', icon: CheckCircle2 },
  ADDED_TO_MENU: { label: 'Added to menu', tone: 'green', icon: Sparkles },
  REJECTED: { label: 'Rejected', tone: 'red', icon: Ban },
  UPCOMING: { label: 'Upcoming', tone: 'blue', icon: Clock },
  ACTIVE: { label: 'Active', tone: 'green', icon: Sparkles },
  AVAILABLE: { label: 'Available', tone: 'green', icon: CheckCircle2 },
  OCCUPIED: { label: 'Occupied', tone: 'amber', icon: CircleDot },
  RESERVED: { label: 'Reserved', tone: 'blue', icon: Clock },
  OFFLINE: { label: 'Offline', tone: 'neutral', icon: Ban },
  OPEN: { label: 'Open', tone: 'green', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', tone: 'neutral', icon: Ban },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = ORDER_MAP[status] ?? { label: status, tone: 'neutral' as const, icon: CircleDot };
  const Icon = entry.icon;
  return (
    <Badge tone={entry.tone}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {entry.label}
    </Badge>
  );
}
