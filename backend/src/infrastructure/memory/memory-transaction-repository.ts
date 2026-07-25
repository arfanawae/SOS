import type { CreateTransactionInput, Transaction, UpdateTransactionInput } from '../../domain/entities/transaction'
import type { TransactionRepository } from '../../domain/repositories/transaction-repository'

export class MemoryTransactionRepository implements TransactionRepository {
  private readonly transactions = new Map<string, Transaction>()

  async findByUserId(userId: string): Promise<Transaction[]> {
    return [...this.transactions.values()]
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) ?? null
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      category: input.category,
      note: input.note ?? '',
      date: input.date,
      createdAt: new Date().toISOString(),
    }
    this.transactions.set(transaction.id, transaction)
    return transaction
  }

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction | null> {
    const existing = this.transactions.get(id)
    if (!existing) return null
    const updated: Transaction = {
      ...existing,
      type: input.type ?? existing.type,
      amount: input.amount ?? existing.amount,
      category: input.category ?? existing.category,
      note: input.note ?? existing.note,
      date: input.date ?? existing.date,
    }
    this.transactions.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.transactions.delete(id)
  }
}
