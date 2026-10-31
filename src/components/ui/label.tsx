// Label component: a styled form label.
import { forwardRef, type LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none text-gray-900 dark:text-gray-100',
        className,
      )}
      {...props}
    />
  ),
)
Label.displayName = 'Label'
