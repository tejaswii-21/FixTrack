// StatCard: a small card showing an icon, a label, and a value.
//
// Used in dashboard grids to show aggregate counts (total complaints,
// pending, overdue, etc.). Optionally shows a trend indicator.
import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  /** Label shown above the value (e.g. "Total Complaints"). */
  title: string
  /** The numeric or string value to display. */
  value: string | number
  /** Lucide icon component for the badge. */
  icon: LucideIcon
  /** Background/text color theme for the icon badge. */
  color?: 'royal' | 'amber' | 'blue' | 'indigo' | 'green' | 'red' | 'orange' | 'cyan'
  /** Optional trend indicator (e.g. "+12% this week"). */
  trend?: { value: string; positive: boolean }
  className?: string
}

// Tailwind classes for each color option (icon badge background + text).
const colorClasses: Record<NonNullable<StatCardProps['color']>, string> = {
  royal: 'bg-royal/10 text-royal dark:bg-royal/20',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'royal',
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-4 p-5">
        {/* Icon badge */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
            colorClasses[color],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        {/* Label + value */}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-0.5 text-xs',
                trend.positive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
