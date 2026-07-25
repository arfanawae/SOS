import type { CreateTransactionInput, Transaction, UpdateTransactionInput } from '../entities/transaction'

export interface TransactionRepository {
  findByUserId(userId: string): Promise<Transaction[]>
  findById(id: string): Promise<Transaction | null>
  create(input: CreateTransactionInput): Promise<Transaction>
  update(id: string, input: UpdateTransactionInput): Promise<Transaction | null>
  delete(id: string): Promise<boolean>
}
