// Shared utility helpers for FixTrack.
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
} from 'date-fns'
import type { ComplaintStatus, Priority } from '@/types'

// ---------------------------------------------------------------------------
// Class name helper (used by every UI component)
// ---------------------------------------------------------------------------

/**
 * cn() merges Tailwind classes safely.
 * - clsx handles conditional class objects/arrays.
 * - tailwind-merge resolves conflicting Tailwind utilities (later wins).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Date formatting (uses date-fns)
// ---------------------------------------------------------------------------

/** Format a date as "Jan 15, 2026". Accepts Date or ISO string. */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return format(d, 'MMM d, yyyy')
}

/** Format a date+time as "Jan 15, 2026 3:30 PM". Accepts Date or ISO string. */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return format(d, 'MMM d, yyyy h:mm a')
}

/** Format a date as a relative time like "2 hours ago". Accepts Date or ISO string. */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return formatDistanceToNow(d, { addSuffix: true })
}

// ---------------------------------------------------------------------------
// CSV escaping (basic: commas, quotes, newlines)
// ---------------------------------------------------------------------------

/**
 * Escape a single value for CSV output.
 * - Wraps the value in double quotes if it contains a comma, double quote,
 *   or newline.
 * - Doubles any internal double quotes (per RFC 4180).
 * - null/undefined become an empty string.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Build a CSV row string from an array of values, applying escapeCsvValue to
 * each value and joining with commas.
 */
export function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsvValue).join(',')
}

// ---------------------------------------------------------------------------
// Status / priority colors (Tailwind classes for badges)
// ---------------------------------------------------------------------------

/**
 * Return Tailwind classes for a status badge.
 * Green=resolved, amber=pending, red=cancelled, blue=in-progress, etc.
 */
export function getStatusColor(status: ComplaintStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    case 'assigned':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'reopened':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

/**
 * Return Tailwind classes for a priority badge.
 * Red=critical, orange=high, cyan/blue=medium, gray=low.
 */
export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    case 'medium':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
    case 'low':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
  }
}

// ---------------------------------------------------------------------------
// SLA / overdue helpers
// ---------------------------------------------------------------------------

/**
 * A complaint is overdue when its deadline (dueAt) is in the past AND its
 * status is neither Resolved nor Cancelled. Returns false if dueAt is missing.
 */
export function isOverdue(
  dueAt: string | Date | null | undefined,
  status: ComplaintStatus,
): boolean {
  if (!dueAt) return false
  if (status === 'resolved' || status === 'cancelled') return false
  const d = typeof dueAt === 'string' ? parseISO(dueAt) : dueAt
  if (!isValid(d)) return false
  return d.getTime() < Date.now()
}

// ---------------------------------------------------------------------------
// Complaint number formatting
// ---------------------------------------------------------------------------

/** Regular expression for a valid complaint number: CMP-YYYY-NNNN. */
export const COMPLAINT_NUMBER_REGEX = /^CMP-\d{4}-\d{4}$/

/**
 * Ensure a complaint number is in the CMP-YYYY-NNNN format.
 * If already correct, returns it as-is. Otherwise normalizes a plain number
 * into the current-year format (used for display fallbacks only; the real
 * number is always generated by the database).
 */
export function formatComplaintNumber(num: string | number): string {
  const str = String(num)
  if (COMPLAINT_NUMBER_REGEX.test(str)) return str.toUpperCase()
  // If a bare numeric sequence was passed, format it with the current year.
  const digits = str.replace(/\D/g, '')
  const year = new Date().getFullYear()
  const padded = digits.padStart(4, '0').slice(-4)
  return `CMP-${year}-${padded}`
}

/** Extract the numeric sequence from a complaint number (for sorting/search). */
export function parseComplaintNumber(num: string): number {
  const match = num.match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}
