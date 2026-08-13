import Badge from "@/components/ui/Badge";
import { getStatusStyle, StatusDomain } from "@/constants/statuses";

interface StatusBadgeProps {
  domain: StatusDomain;
  status: string;
  className?: string;
}

// Drop-in badge for any claim/coverage/transaction/member status value
// coming straight from the API — looks up the label + color from the
// single status reference in constants/statuses.ts, so the color never
// needs to be picked by hand at the call site.
export default function StatusBadge({
  domain,
  status,
  className,
}: StatusBadgeProps) {

  const style = getStatusStyle(domain, status);

  return (
    <Badge tone={style.tone} className={className}>
      {style.label}
    </Badge>
  );
}
