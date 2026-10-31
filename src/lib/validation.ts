// Zod validation schemas for FixTrack forms.
//
// Each schema validates a form's inputs before submission. The matching
// React Hook Form setup uses @hookform/resolvers/zod to connect these.
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Auth forms
// ---------------------------------------------------------------------------

/** Login form: email + password (min 8 chars). */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

/** Registration form: email, password, full name, optional phone. */
export const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name is too long'),
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

/** Password reset request form: just email. */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

/** Password reset form: new password + confirmation. */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

// ---------------------------------------------------------------------------
// Complaint forms
// ---------------------------------------------------------------------------

/** Submit complaint form. */
export const complaintSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  category_id: z.string().uuid('Please select a category'),
  building: z.string().min(1, 'Building is required'),
  location: z.string().min(1, 'Location is required'),
  floor: z.string().max(10, 'Floor must be 10 characters or fewer').optional().or(z.literal('')),
  room_number: z
    .string()
    .max(10, 'Room number must be 10 characters or fewer')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
})

export type ComplaintFormValues = z.infer<typeof complaintSchema>

// ---------------------------------------------------------------------------
// Category management form
// ---------------------------------------------------------------------------

/** Category create/edit form. */
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional().or(z.literal('')),
  default_priority: z.enum(['low', 'medium', 'high', 'critical']),
  active: z.boolean().optional().default(true),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// ---------------------------------------------------------------------------
// Comment form
// ---------------------------------------------------------------------------

/** Add a comment or internal note. */
export const commentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
  visibility: z.enum(['public', 'internal']),
})

export type CommentFormValues = z.infer<typeof commentSchema>

// ---------------------------------------------------------------------------
// Feedback form (rating + feedback + optional reopening reason)
// ---------------------------------------------------------------------------

/** Complaint feedback / reopening request. */
export const feedbackSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be 5 or less').optional(),
  feedback: z.string().max(2000, 'Feedback is too long').optional().or(z.literal('')),
  reopening_reason: z.string().max(2000, 'Reason is too long').optional().or(z.literal('')),
})

export type FeedbackFormValues = z.infer<typeof feedbackSchema>
