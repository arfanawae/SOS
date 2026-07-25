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

export interface CreateTransactionBody {
  userId: string
  type: TransactionType
  amount: number
  category: string
  note?: string
  date: string
}

export interface UpdateTransactionBody {
  type?: TransactionType
  amount?: number
  category?: string
  note?: string
  date?: string
}

export interface TransactionListResponse {
  data: Transaction[]
}

export interface TransactionResponse {
  data: Transaction
}

export interface SummaryResponse {
  data: {
    totalIncome: number
    totalExpense: number
    balance: number
  }
}
