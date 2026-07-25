import type { CreateTransactionInput, Transaction, TransactionType, UpdateTransactionInput } from '../domain/entities/transaction'
import { NotFoundError, ValidationError } from '../domain/errors'
import type { TransactionRepository } from '../domain/repositories/transaction-repository'

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository
  ) {}

  async listByUser(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId)
  }

  async getTransaction(id: string): Promise<Transaction> {
    const tx = await this.transactionRepository.findById(id)
    if (!tx) throw new NotFoundError('Transaction')
    return tx
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    this.validateTransaction(input.type, input.amount, input.category, input.date)
    return this.transactionRepository.create(input)
  }

  async updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    if (input.amount !== undefined || input.type !== undefined || input.category !== undefined || input.date !== undefined) {
      const existing = await this.transactionRepository.findById(id)
      if (!existing) throw new NotFoundError('Transaction')
      this.validateTransaction(
        input.type ?? existing.type,
        input.amount ?? existing.amount,
        input.category ?? existing.category,
        input.date ?? existing.date
      )
    }
    const updated = await this.transactionRepository.update(id, input)
    if (!updated) throw new NotFoundError('Transaction')
    return updated
  }

  async deleteTransaction(id: string): Promise<void> {
    const deleted = await this.transactionRepository.delete(id)
    if (!deleted) throw new NotFoundError('Transaction')
  }

  async getSummary(userId: string): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
    const transactions = await this.transactionRepository.findByUserId(userId)
    let totalIncome = 0
    let totalExpense = 0
    for (const tx of transactions) {
      if (tx.type === 'income') totalIncome += tx.amount
      else totalExpense += tx.amount
    }
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    }
  }

  private validateTransaction(type: string, amount: number, category: string, date: string): void {
    if (!['income', 'expense'].includes(type)) {
      throw new ValidationError('type must be "income" or "expense"')
    }
    if (typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('amount must be a positive number')
    }
    if (!category?.trim()) {
      throw new ValidationError('category is required')
    }
    if (!date || isNaN(Date.parse(date))) {
      throw new ValidationError('date must be a valid ISO date string')
    }
  }
}
