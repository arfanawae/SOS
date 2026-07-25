import type { CreateTransactionInput, Transaction, UpdateTransactionInput } from '../../domain/entities/transaction'
import type { TransactionRepository } from '../../domain/repositories/transaction-repository'

interface TransactionRow {
  id: string
  user_id: string
  type: string
  amount: number
  category: string
  note: string
  date: string
  created_at: string
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as Transaction['type'],
    amount: row.amount,
    category: row.category,
    note: row.note,
    date: row.date,
    createdAt: row.created_at,
  }
}

export class D1TransactionRepository implements TransactionRepository {
  constructor(private readonly db: D1Database) {}

  async findByUserId(userId: string): Promise<Transaction[]> {
    const { results } = await this.db
      .prepare('SELECT id, user_id, type, amount, category, note, date, created_at FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
      .bind(userId)
      .all<TransactionRow>()
    return results.map(toTransaction)
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.db
      .prepare('SELECT id, user_id, type, amount, category, note, date, created_at FROM transactions WHERE id = ?')
      .bind(id)
      .first<TransactionRow>()
    return row ? toTransaction(row) : null
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const note = input.note ?? ''
    await this.db
      .prepare('INSERT INTO transactions (id, user_id, type, amount, category, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, input.userId, input.type, input.amount, input.category, note, input.date, createdAt)
      .run()
    return { id, userId: input.userId, type: input.type, amount: input.amount, category: input.category, note, date: input.date, createdAt }
  }

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const type = input.type ?? existing.type
    const amount = input.amount ?? existing.amount
    const category = input.category ?? existing.category
    const note = input.note ?? existing.note
    const date = input.date ?? existing.date
    await this.db
      .prepare('UPDATE transactions SET type = ?, amount = ?, category = ?, note = ?, date = ? WHERE id = ?')
      .bind(type, amount, category, note, date, id)
      .run()
    return { ...existing, type, amount, category, note, date }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  }
}
