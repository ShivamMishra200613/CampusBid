import { z } from 'zod';

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .email('Invalid email address')
  .toLowerCase()
  .refine((val) => val.endsWith('@ves.ac.in'), {
    message: 'Email must end with @ves.ac.in'
  });

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .regex(passwordRegex, 'Password must contain at least one letter and one number');

export const registerSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Full name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional(),
    classBranch: z.string().trim().optional().default(''),
    rollNo: z.string().trim().optional().default(''),
    phone: z.string().trim().optional(),
    bio: z.string().trim().optional(),
    agreeTerms: z.boolean().optional()
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required')
  })
  .strict();

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().trim().optional(),
    classBranch: z.string().trim().optional(),
    bio: z.string().trim().optional(),
    avatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')).optional(),
    notificationPreferences: z
      .object({
        outbidAlerts: z.boolean().optional(),
        auctionEndingAlerts: z.boolean().optional(),
        newMessageAlerts: z.boolean().optional()
      })
      .optional()
  })
  .strict();

export const createProductSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters'),
    category: z.enum(
      ['electronics', 'books', 'furniture', 'fashion', 'sports', 'others'],
      { required_error: 'Category is required' }
    ),
    condition: z
      .string({ required_error: 'Condition is required' })
      .trim()
      .min(2, 'Condition must be at least 2 characters'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters'),
    startingBid: z
      .number({ required_error: 'Starting bid is required' })
      .positive('Starting bid must be greater than zero')
      .min(1, 'Starting bid must be at least ₹1'),
    minIncrement: z
      .number()
      .positive('Minimum increment must be greater than zero')
      .min(1)
      .optional()
      .default(50),
    duration: z.enum(['24h', '3d', '7d'], {
      required_error: 'Duration is required'
    }),
    images: z
      .array(z.string().trim().min(1, 'Image URL cannot be empty'))
      .min(1, 'At least one image is required')
      .max(5, 'Maximum 5 images allowed')
      .optional()
      .default([]),
    isDraft: z.boolean().optional().default(false)
  })
  .strict();

export const updateProductSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    category: z.enum(['electronics', 'books', 'furniture', 'fashion', 'sports', 'others']).optional(),
    condition: z.string().trim().min(2).optional(),
    description: z.string().trim().min(10).optional(),
    startingBid: z.number().positive().min(1).optional(),
    minIncrement: z.number().positive().min(1).optional(),
    duration: z.enum(['24h', '3d', '7d']).optional(),
    images: z.array(z.string()).min(1).max(5).optional(),
    isDraft: z.boolean().optional()
  })
  .strict();

export const placeBidSchema = z
  .object({
    amount: z
      .number({ required_error: 'Bid amount is required' })
      .positive('Bid amount must be a positive number')
      .min(1, 'Bid amount must be at least ₹1')
  })
  .strict();

export const moderateListingSchema = z
  .object({
    action: z.enum(['approve', 'reject'], {
      required_error: 'Action must be approve or reject'
    }),
    reason: z.string().trim().optional()
  })
  .strict();

export const resolveReportSchema = z
  .object({
    resolutionAction: z.enum(['dismiss', 'remove_listing', 'suspend_user', 'warn_seller'], {
      required_error: 'Valid resolution action is required'
    }),
    notes: z.string().trim().optional()
  })
  .strict();

export const reportListingSchema = z
  .object({
    reason: z
      .string({ required_error: 'Reason is required' })
      .trim()
      .min(3, 'Reason must be at least 3 characters')
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: emailSchema
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: 'Token is required' }).min(1, 'Token is required'),
    newPassword: passwordSchema
  })
  .strict();
