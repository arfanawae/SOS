<script setup lang="ts">
import { useTransactionStore } from '@/stores/use-transaction-store'
import type { CreateTransactionBody, Transaction } from '@/models/transaction'

const transactionStore = useTransactionStore()
const { transactions, isLoading, error, summary } = storeToRefs(transactionStore)

// Assume first user for demo — in production use logged-in user
const currentUserId = ref('')

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Category', key: 'category' },
  { title: 'Amount', key: 'amount', sortable: true },
  { title: 'Note', key: 'note' },
  { title: 'Action', key: 'action', sortable: false, align: 'end' as const },
]

const dialog = ref(false)
const deleteDialog = ref(false)
const isSubmitting = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const deletingTransaction = ref<Transaction | null>(null)

const form = ref<CreateTransactionBody>({
  userId: '',
  type: 'expense',
  amount: 0,
  category: '',
  note: '',
  date: new Date().toISOString().slice(0, 10),
})

const INCOME_CATEGORIES = ['เงินเดือน', 'โบนัส', 'ขายของ', 'ลงทุน', 'ฟรีแลนซ์', 'ดอกเบี้ย', 'อื่นๆ']
const EXPENSE_CATEGORIES = ['อาหาร', 'เดินทาง', 'ที่อยู่', 'สาธารณูปโภค', 'ประกัน', 'ความบันเทิง', 'ช้อปปิ้ง', 'สุขภาพ', 'การศึกษาลูก', 'เที่ยว', 'อื่นๆ']

const categories = computed(() =>
  form.value.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
)

function openCreate() {
  editingTransaction.value = null
  form.value = {
    userId: currentUserId.value,
    type: 'expense',
    amount: 0,
    category: '',
    note: '',
    date: new Date().toISOString().slice(0, 10),
  }
  dialog.value = true
}

function openEdit(tx: Transaction) {
  editingTransaction.value = tx
  form.value = {
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    note: tx.note,
    date: tx.date.slice(0, 10),
  }
  dialog.value = true
}

function openDelete(tx: Transaction) {
  deletingTransaction.value = tx
  deleteDialog.value = true
}

async function submit() {
  isSubmitting.value = true
  try {
    if (editingTransaction.value)
      await transactionStore.updateTransaction(editingTransaction.value.id, {
        type: form.value.type,
        amount: form.value.amount,
        category: form.value.category,
        note: form.value.note,
        date: form.value.date,
      })
    else
      await transactionStore.createTransaction(form.value as CreateTransactionBody)
    dialog.value = false
    if (currentUserId.value) transactionStore.fetchSummary(currentUserId.value)
  }
  finally {
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  if (!deletingTransaction.value) return
  isSubmitting.value = true
  try {
    await transactionStore.deleteTransaction(deletingTransaction.value.id)
    deleteDialog.value = false
    if (currentUserId.value) transactionStore.fetchSummary(currentUserId.value)
  }
  finally {
    isSubmitting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { dateStyle: 'medium' })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
}

onMounted(async () => {
  // In real app, get userId from auth
  // For now, list users to pick first one
  try {
    const { userApi } = await import('@/apis/user-api')
    const res = await userApi.list()
    if (res.data.length > 0) {
      currentUserId.value = res.data[0].id
      await Promise.all([
        transactionStore.fetchTransactions(currentUserId.value),
        transactionStore.fetchSummary(currentUserId.value),
      ])
    }
  }
  catch {
    // No users yet
  }
})
</script>

<template>
  <div>
    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" rounded class="me-3">
              <VIcon icon="ri-arrow-up-line" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">รายรับ</div>
              <div class="text-h5 font-weight-bold text-success">
                {{ formatCurrency(summary.totalIncome) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" rounded class="me-3">
              <VIcon icon="ri-arrow-down-line" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">รายจ่าย</div>
              <div class="text-h5 font-weight-bold text-error">
                {{ formatCurrency(summary.totalExpense) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" rounded class="me-3">
              <VIcon icon="ri-wallet-3-line" />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">คงเหลือ</div>
              <div class="text-h5 font-weight-bold text-primary">
                {{ formatCurrency(summary.balance) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Transactions Table -->
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6">รายการรายรับ-รายจ่าย</span>
        <VBtn
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          เพิ่มรายการ
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VAlert
        v-if="error"
        type="error"
        class="ma-4"
        :text="error"
        closable
      />

      <VDataTable
        :headers="headers"
        :items="transactions"
        :loading="isLoading"
        hover
      >
        <template #item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <template #item.type="{ item }">
          <VChip
            :color="item.type === 'income' ? 'success' : 'error'"
            size="small"
          >
            {{ item.type === 'income' ? '💰 รายรับ' : '💸 รายจ่าย' }}
          </VChip>
        </template>

        <template #item.amount="{ item }">
          <span :class="item.type === 'income' ? 'text-success' : 'text-error'" class="font-weight-bold">
            {{ item.type === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
          </span>
        </template>

        <template #item.action="{ item }">
          <IconBtn @click="openEdit(item)">
            <VTooltip activator="parent" location="top">แก้ไข</VTooltip>
            <VIcon icon="ri-pencil-line" />
          </IconBtn>
          <IconBtn color="error" @click="openDelete(item)">
            <VTooltip activator="parent" location="top">ลบ</VTooltip>
            <VIcon icon="ri-delete-bin-line" />
          </IconBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8 text-disabled">
            ยังไม่มีรายการ กด "เพิ่มรายการ" เพื่อเริ่มบันทึก
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Create / Edit Dialog -->
    <VDialog v-model="dialog" max-width="520" persistent>
      <VCard :title="editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการ'">
        <VCardText>
          <VForm @submit.prevent="submit">
            <VRow>
              <VCol cols="6">
                <VSelect
                  v-model="form.type"
                  label="ประเภท"
                  :items="[
                    { title: '💰 รายรับ', value: 'income' },
                    { title: '💸 รายจ่าย', value: 'expense' },
                  ]"
                  prepend-inner-icon="ri-exchange-line"
                  class="mb-4"
                  required
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="form.amount"
                  label="จำนวนเงิน"
                  type="number"
                  prepend-inner-icon="ri-money-dollar-circle-line"
                  prefix="฿"
                  required
                />
              </VCol>
            </VRow>

            <VSelect
              v-model="form.category"
              label="หมวดหมู่"
              :items="categories"
              prepend-inner-icon="ri-price-tag-3-line"
              class="mb-4"
              required
            />

            <VTextField
              v-model="form.date"
              label="วันที่"
              type="date"
              prepend-inner-icon="ri-calendar-line"
              class="mb-4"
              required
            />

            <VTextField
              v-model="form.note"
              label="บันทึกเพิ่มเติม"
              prepend-inner-icon="ri-sticky-note-line"
            />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end pa-4">
          <VBtn variant="text" @click="dialog = false">ยกเลิก</VBtn>
          <VBtn
            color="primary"
            :loading="isSubmitting"
            @click="submit"
          >
            {{ editingTransaction ? 'บันทึก' : 'เพิ่ม' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard title="ลบรายการ">
        <VCardText>
          แน่ใจหรือว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
        </VCardText>
        <VCardActions class="justify-end pa-4">
          <VBtn variant="text" @click="deleteDialog = false">ยกเลิก</VBtn>
          <VBtn
            color="error"
            :loading="isSubmitting"
            @click="confirmDelete"
          >
            ลบ
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
