// Select component (native, styled with Tailwind).
//
// A native <select> is used for reliability and beginner-friendliness instead
// of a complex custom dropdown. It is fully accessible and keyboard-friendly
// out of the box. Provides Select, SelectTrigger (a styled wrapper), and
// SelectItem (an <option>).
//
// Usage:
//   <Select value={v} onChange={(e) => set(e.target.value)}>
//     <SelectItem value="low">Low</SelectItem>
//   </Select>
import {
  forwardRef,
  type HTMLAttributes,
  type OptionHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

/** Styled native select. Accepts <SelectItem> (<option>) children. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/60 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

/** A label-like trigger row shown above a Select (optional helper). */
export function SelectTrigger({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between text-sm font-medium', className)}
      {...props}
    />
  )
}

/** Placeholder/value display helper (optional, for custom layouts). */
export function SelectValue({ placeholder, value }: { placeholder?: string; value?: string }) {
  return <span className={cn(!value && 'text-gray-400')}>{value || placeholder}</span>
}

/** A styled <option>. */
export const SelectItem = forwardRef<
  HTMLOptionElement,
  OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => (
  <option ref={ref} className={cn('text-gray-900 dark:bg-gray-900 dark:text-gray-100', className)} {...props} />
))
SelectItem.displayName = 'SelectItem'
