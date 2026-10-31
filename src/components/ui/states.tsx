// Reusable loading, empty, and error state components.
//
// These are used across pages to show consistent feedback when data is
// loading, missing, or an error occurred.
import { type ReactNode } from 'react'
import { Loader2, Inbox, AlertCircle, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// LoadingState
// ---------------------------------------------------------------------------

/**
 * A centered spinner with an optional message.
 * Use this while data is being fetched.
 */
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-royal" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  /** Icon to display (defaults to an inbox icon). */
  icon?: LucideIcon
  /** Bold heading text. */
  title: string
  /** Optional supporting description. */
  description?: string
  /** Optional action (e.g. a "Create" button). */
  action?: ReactNode
  className?: string
}

/**
 * A centered "nothing here yet" card with an icon, message, and optional action.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Icon className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

interface ErrorStateProps {
  /** The error message to display. */
  message?: string
  /** Optional retry handler. When provided, a "Try again" button is shown. */
  onRetry?: () => void
  className?: string
}

/**
 * A centered error card with an alert icon and optional retry button.
 */
export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{message}</h3>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-2">
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// PageHeader (bonus helper used by most pages)
// ---------------------------------------------------------------------------

interface PageHeaderProps {
  title: string
  description?: string
  /** Optional action rendered on the right side (e.g. a "New" button). */
  action?: ReactNode
  className?: string
}

/**
 * A consistent page title row with an optional description and action button.
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
