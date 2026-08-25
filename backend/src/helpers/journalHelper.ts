import { supabase } from '../config/database';
import { TABLES } from '../utils/tables';

// ─────────────────────────────────────────────
// Chart of Accounts (Kode Akun Standar)
// ─────────────────────────────────────────────
export const ACCOUNTS = {
  KAS_BANK:           { code: '1001', name: 'Kas & Bank' },
  PIUTANG_USAHA:      { code: '1002', name: 'Piutang Usaha' },
  PERSEDIAAN_BARANG:  { code: '1003', name: 'Persediaan Barang Dagang' },
  HUTANG_SUPPLIER:    { code: '2001', name: 'Hutang Supplier' },
  MODAL_INVESTOR:     { code: '3001', name: 'Modal Investor / Pemilik' },
  PENDAPATAN:         { code: '4001', name: 'Pendapatan Penjualan' },
  HPP:                { code: '5001', name: 'Harga Pokok Penjualan (HPP)' },
  BEBAN_OPERASIONAL:  { code: '6001', name: 'Beban Operasional' },
} as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalParams {
  userId: string;
  transactionType: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'DEBT_PAYMENT' | 'OTHER';
  referenceId: string;
  transactionDate: string; // ISO string
  entries: JournalEntryLine[];
}

// ─────────────────────────────────────────────
// Helper: Insert Journal Entries (Non-Fatal)
// ─────────────────────────────────────────────
export const createJournalEntries = async (params: CreateJournalParams): Promise<void> => {
  try {
    const { userId, transactionType, referenceId, transactionDate, entries } = params;

    if (!entries || entries.length === 0) {
      console.warn('[Journal] No entries provided, skipping.');
      return;
    }

    const rows = entries.map((entry) => ({
      user_id: userId,
      transaction_type: transactionType,
      reference_id: referenceId,
      journal_date: transactionDate,
      account_code: entry.accountCode,
      account_name: entry.accountName,
      debit: Math.max(0, entry.debit || 0),
      credit: Math.max(0, entry.credit || 0),
      notes: entry.description || null,
    }));

    const { error } = await supabase
      .from(TABLES.JOURNALS)
      .insert(rows);

    if (error) {
      console.warn(`[Journal] Insert failed for ${transactionType} ref=${referenceId}:`, error.message);
    } else {
      console.log(`[Journal] ${rows.length} entries recorded for ${transactionType} ref=${referenceId}`);
    }
  } catch (err: any) {
    // Non-fatal: journal failure should never block the main transaction
    console.warn('[Journal] Exception (non-fatal):', err.message);
  }
};

// ─────────────────────────────────────────────
// Helper: Delete Journal Entries by Reference ID
// ─────────────────────────────────────────────
export const deleteJournalEntries = async (userId: string, referenceId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.JOURNALS)
      .delete()
      .eq('reference_id', referenceId)
      .eq('user_id', userId);

    if (error) {
      console.warn(`[Journal] Delete failed for ref=${referenceId}:`, error.message);
    } else {
      console.log(`[Journal] Entries deleted for ref=${referenceId}`);
    }
  } catch (err: any) {
    console.warn('[Journal] Delete Exception (non-fatal):', err.message);
  }
};

