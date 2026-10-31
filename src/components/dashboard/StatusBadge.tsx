// StatusBadge: a colored pill that displays a complaint's status.
//
// Uses the getStatusColor() helper from @/lib/utils so the color mapping
// stays in one place.
import { cn, getStatusColor } from '@/lib/utils'
import type { ComplaintStatus } from '@/types'

// Human-readable labels for each status value.
const statusLabels: Record<ComplaintStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  reopened: 'Reopened',
  cancelled: 'Cancelled',
}

interface StatusBadgeProps {
  status: ComplaintStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusColor(status),
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
