import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import {
  createTransactionSchema,
  errorResponseSchema,
  idParamSchema,
  summaryResponseSchema,
  transactionListResponseSchema,
  transactionResponseSchema,
  updateTransactionSchema,
  userIdParamSchema,
} from '../schemas/transaction-schemas'
import type { AppEnv } from '../types'

const jsonContent = (schema: Parameters<typeof resolver>[0]) => ({
  'application/json': { schema: resolver(schema) },
})

export function createTransactionRouter() {
  const router = new Hono<AppEnv>()

  // Summary (must be before /:userId routes to avoid param conflict)
  router.get(
    '/summary/:userId',
    describeRoute({
      tags: ['Transactions'],
      summary: 'Get income/expense summary for a user',
      responses: {
        200: { description: 'Summary', content: jsonContent(summaryResponseSchema) },
      },
    }),
    validator('param', userIdParamSchema),
    (c) => c.get('container').transactionHandler.summary(c)
  )

  router.get(
    '/user/:userId',
    describeRoute({
      tags: ['Transactions'],
      summary: 'List transactions by user',
      responses: {
        200: { description: 'All transactions for user', content: jsonContent(transactionListResponseSchema) },
      },
    }),
    validator('param', userIdParamSchema),
    (c) => c.get('container').transactionHandler.listByUser(c)
  )

  router.post(
    '/',
    describeRoute({
      tags: ['Transactions'],
      summary: 'Create a transaction',
      responses: {
        201: { description: 'Transaction created', content: jsonContent(transactionResponseSchema) },
        400: { description: 'Invalid input', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('json', createTransactionSchema),
    (c) => c.get('container').transactionHandler.create(c)
  )

  router.get(
    '/:id',
    describeRoute({
      tags: ['Transactions'],
      summary: 'Get a transaction by id',
      responses: {
        200: { description: 'Transaction found', content: jsonContent(transactionResponseSchema) },
        404: { description: 'Transaction not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    (c) => c.get('container').transactionHandler.get(c)
  )

  router.patch(
    '/:id',
    describeRoute({
      tags: ['Transactions'],
      summary: 'Update a transaction',
      responses: {
        200: { description: 'Transaction updated', content: jsonContent(transactionResponseSchema) },
        400: { description: 'Invalid input', content: jsonContent(errorResponseSchema) },
        404: { description: 'Transaction not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    validator('json', updateTransactionSchema),
    (c) => c.get('container').transactionHandler.update(c)
  )

  router.delete(
    '/:id',
    describeRoute({
      tags: ['Transactions'],
      summary: 'Delete a transaction',
      responses: {
        204: { description: 'Transaction deleted' },
        404: { description: 'Transaction not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    (c) => c.get('container').transactionHandler.delete(c)
  )

  return router
}
