export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  category: string
  note: string
  date: string
  createdAt: string
}

export interface CreateTransactionInput {
  userId: string
  type: TransactionType
  amount: number
  category: string
  note?: string
  date: string
}

export interface UpdateTransactionInput {
  type?: TransactionType
  amount?: number
  category?: string
  note?: string
  date?: string
}
