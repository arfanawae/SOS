import z from 'zod'

export const transactionTypeSchema = z.enum(['income', 'expense'])

export const transactionSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  type: transactionTypeSchema,
  amount: z.number().positive(),
  category: z.string(),
  note: z.string(),
  date: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export const createTransactionSchema = z.object({
  userId: z.string().min(1),
  type: transactionTypeSchema,
  amount: z.number().positive(),
  category: z.string().min(1),
  note: z.string().optional(),
  date: z.string().min(1),
})

export const updateTransactionSchema = z.object({
  type: transactionTypeSchema.optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  note: z.string().optional(),
  date: z.string().min(1).optional(),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})

export const userIdParamSchema = z.object({
  userId: z.string().min(1),
})

export const transactionResponseSchema = z.object({ data: transactionSchema })
export const transactionListResponseSchema = z.object({ data: z.array(transactionSchema) })
export const summaryResponseSchema = z.object({
  data: z.object({
    totalIncome: z.number(),
    totalExpense: z.number(),
    balance: z.number(),
  }),
})

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
