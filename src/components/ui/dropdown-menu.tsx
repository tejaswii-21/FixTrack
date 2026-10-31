// DropdownMenu component: a simple controlled menu (no external dependency).
//
// A lightweight, accessible-ish dropdown built with React state. Click the
// trigger to toggle, click outside or Escape to close. Provides:
//   DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
//   DropdownMenuLabel, DropdownMenuSeparator.
//
// This is intentionally simpler than Radix DropdownMenu to keep the project
// beginner-friendly and dependency-light. The trigger always renders a button;
// pass any content (icon + text) as its children.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const DropdownMenuContext = createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
})

function useDropdownMenu() {
  const ctx = useContext(DropdownMenuContext)
  return ctx
}

/** Root menu component manages open/closed state. */
export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside the menu.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

/** Trigger button. Clicking toggles the menu. */
export function DropdownMenuTrigger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { open, setOpen } = useDropdownMenu()
  return (
    <button
      type="button"
      className={cn('inline-flex items-center', className)}
      onClick={() => setOpen(!open)}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {children}
    </button>
  )
}

/** The floating content panel shown when open. */
export function DropdownMenuContent({
  children,
  className,
  align = 'right',
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  const { open } = useDropdownMenu()
  if (!open) return null
  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-2 min-w-[10rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** A clickable menu item. */
export function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const { setOpen } = useDropdownMenu()
  const handleClick = useCallback(() => {
    onClick?.()
    setOpen(false)
  }, [onClick, setOpen])
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm text-gray-900 outline-none hover:bg-gray-100 focus:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800',
        className,
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

/** A non-interactive label/heading inside the menu. */
export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300', className)}>
      {children}
    </div>
  )
}

/** A thin separator line. */
export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700', className)} />
}

/** Shared HTML attributes convenience re-export for custom wrappers. */
export type DropdownContentProps = HTMLAttributes<HTMLDivElement>
