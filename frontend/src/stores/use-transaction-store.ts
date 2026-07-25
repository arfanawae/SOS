import { defineStore } from 'pinia'
import { transactionApi } from '@/apis/transaction-api'
import type { CreateTransactionBody, Transaction, UpdateTransactionBody } from '@/models/transaction'

export const useTransactionStore = defineStore('TransactionStore', () => {
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const summary = ref({ totalIncome: 0, totalExpense: 0, balance: 0 })

  async function fetchTransactions(userId: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await transactionApi.listByUser(userId)
      transactions.value = res.data
    }
    catch (e: any) {
      error.value = e.message
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchSummary(userId: string) {
    try {
      const res = await transactionApi.summary(userId)
      summary.value = res.data
    }
    catch (e: any) {
      error.value = e.message
    }
  }

  async function createTransaction(body: CreateTransactionBody) {
    const res = await transactionApi.create(body)
    transactions.value.unshift(res.data)
    return res.data
  }

  async function updateTransaction(id: string, body: UpdateTransactionBody) {
    const res = await transactionApi.update(id, body)
    const idx = transactions.value.findIndex(tx => tx.id === id)
    if (idx !== -1) transactions.value[idx] = res.data
    return res.data
  }

  async function deleteTransaction(id: string) {
    await transactionApi.remove(id)
    transactions.value = transactions.value.filter(tx => tx.id !== id)
  }

  return { transactions, isLoading, error, summary, fetchTransactions, fetchSummary, createTransaction, updateTransaction, deleteTransaction }
})
