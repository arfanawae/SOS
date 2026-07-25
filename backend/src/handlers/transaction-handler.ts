import type { Context } from 'hono'
import type { CreateTransactionInput, UpdateTransactionInput } from '../domain/entities/transaction'
import { ValidationError } from '../domain/errors'
import type { TransactionService } from '../services/transaction-service'

export class TransactionHandler {
  constructor(private readonly transactionService: TransactionService) {}

  listByUser = async (c: Context) => {
    const transactions = await this.transactionService.listByUser(this.param(c, 'userId'))
    return c.json({ data: transactions })
  }

  get = async (c: Context) => {
    const tx = await this.transactionService.getTransaction(this.param(c, 'id'))
    return c.json({ data: tx })
  }

  create = async (c: Context) => {
    const body = await this.parseJson<CreateTransactionInput>(c)
    const tx = await this.transactionService.createTransaction(body)
    return c.json({ data: tx }, 201)
  }

  update = async (c: Context) => {
    const body = await this.parseJson<UpdateTransactionInput>(c)
    const tx = await this.transactionService.updateTransaction(this.param(c, 'id'), body)
    return c.json({ data: tx })
  }

  delete = async (c: Context) => {
    await this.transactionService.deleteTransaction(this.param(c, 'id'))
    return c.body(null, 204)
  }

  summary = async (c: Context) => {
    const summary = await this.transactionService.getSummary(this.param(c, 'userId'))
    return c.json({ data: summary })
  }

  private param(c: Context, name: string): string {
    const value = c.req.param(name)
    if (!value) throw new ValidationError(`${name} param is required`)
    return value
  }

  private async parseJson<T>(c: Context): Promise<T> {
    try {
      return await c.req.json<T>()
    } catch {
      throw new ValidationError('Invalid JSON body')
    }
  }
}
