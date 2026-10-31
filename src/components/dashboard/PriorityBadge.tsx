// PriorityBadge: a colored pill that displays a complaint's priority.
//
// Uses the getPriorityColor() helper from @/lib/utils so the color mapping
// stays in one place.
import { cn, getPriorityColor } from '@/lib/utils'
import type { Priority } from '@/types'

// Human-readable labels for each priority value (they happen to match the
// raw values, but a map keeps things explicit and easy to change later).
const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getPriorityColor(priority),
        className,
      )}
    >
      {priorityLabels[priority]}
    </span>
  )
}
