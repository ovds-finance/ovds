/**
 * @ovds/dto/loyalty/zod-bridge — Zod schemas for the loyalty domain
 *
 * Provides Zod versions of the class-validator DTOs in @ovds/dto/loyalty.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 *
 * Usage in React:
 *   import { CreateLoyaltyTransactionSchema } from '@ovds/dto';
 *   const { register, handleSubmit } = useForm({
 *     resolver: createZodResolver(CreateLoyaltyTransactionSchema)
 *   });
 *
 * Usage in NestJS:
 *   import { CreateLoyaltyTransactionSchema } from '@ovds/dto';
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateLoyaltyTransactionSchema)) dto: z.infer<typeof CreateLoyaltyTransactionSchema>) { ... }
 */

import { z } from 'zod';

// ── Loyalty Transaction Type ─────────────────────────────────────────────────

export const LoyaltyTransactionTypeSchema = z.enum(['EARN', 'REDEEM', 'ADJUST', 'EXPIRE', 'BONUS']);
export type LoyaltyTransactionType = z.infer<typeof LoyaltyTransactionTypeSchema>;

// ── Loyalty Transaction Schemas ──────────────────────────────────────────────

export const LoyaltyTransactionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  points: z.number(),
  reason: z.string(),
  referenceId: z.string().nullable().optional(),
  type: LoyaltyTransactionTypeSchema,
  companyId: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const CreateLoyaltyTransactionSchema = z.object({
  customerId: z.string(),
  points: z.number(),
  reason: z.string(),
  referenceId: z.string().optional(),
  type: LoyaltyTransactionTypeSchema.optional(),
  companyId: z.string().optional(),
});

export const LoyaltyBalanceSchema = z.object({
  customerId: z.string(),
  totalPoints: z.number(),
  availablePoints: z.number(),
  pendingPoints: z.number(),
  expiredPoints: z.number(),
  lifetimeEarned: z.number(),
  lifetimeRedeemed: z.number(),
  updatedAt: z.coerce.date(),
});

export const LoyaltyTierSchema = z.object({
  id: z.string(),
  name: z.string(),
  minPoints: z.number().int().nonnegative(),
  maxPoints: z.number().int().nonnegative().nullable().optional(),
  benefits: z.array(z.string()).optional(),
  discountPercentage: z.number().min(0).max(100).default(0),
  companyId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateLoyaltyTierSchema = LoyaltyTierSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

// ── Reward Schemas ───────────────────────────────────────────────────────────

export const RewardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  pointsRequired: z.number().int().positive(),
  value: z.number().nonnegative(),
  currencyCode: z.string().default('ETB'),
  isActive: z.boolean().default(true),
  companyId: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  termsConditions: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateRewardSchema = RewardSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const RedeemRewardSchema = z.object({
  rewardId: z.string(),
  customerId: z.string(),
  pointsToRedeem: z.number().int().positive(),
  notes: z.string().optional(),
});

// ── Type exports ─────────────────────────────────────────────────────────────

export type LoyaltyTransaction = z.infer<typeof LoyaltyTransactionSchema>;
export type CreateLoyaltyTransaction = z.infer<typeof CreateLoyaltyTransactionSchema>;
export type LoyaltyBalance = z.infer<typeof LoyaltyBalanceSchema>;
export type LoyaltyTier = z.infer<typeof LoyaltyTierSchema>;
export type CreateLoyaltyTier = z.infer<typeof CreateLoyaltyTierSchema>;
export type Reward = z.infer<typeof RewardSchema>;
export type CreateReward = z.infer<typeof CreateRewardSchema>;
export type RedeemReward = z.infer<typeof RedeemRewardSchema>;
