import { z } from 'zod';

// ──────────────────────────────────────────────────────────
// Sale Validation Schema
// ──────────────────────────────────────────────────────────
export const saleItemSchema = z.object({
  item_id: z.string().uuid("Item ID must be a valid UUID").or(z.string().min(1)),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price cannot be negative"),
  cost_price: z.number().min(0).optional().nullable(),
  discount: z.number().min(0).optional().default(0),
});

export const createSaleSchema = z.object({
  customer_id: z.string().nullable().optional().or(z.literal('')),
  items: z.array(saleItemSchema).min(1, "At least one item is required for a sale"),
  payment_type: z.enum(['CASH', 'TRANSFER', 'CREDIT', 'QRIS', 'OTHER']).optional().default('CASH'),
  paid_amount: z.number().min(0),
  shipping_cost: z.number().min(0).optional().default(0),
  due_date: z.string().nullable().optional().or(z.literal('')),
  notes: z.string().max(500).optional().nullable(),
  sale_date: z.string().optional().nullable().or(z.literal('')), 
});

// ──────────────────────────────────────────────────────────
// Purchase Validation Schema
// ──────────────────────────────────────────────────────────
export const purchaseItemSchema = z.object({
  item_id: z.string().uuid("Item ID must be a valid UUID").or(z.string().min(1)),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Price cannot be negative"),
});

export const createPurchaseSchema = z.object({
  supplier_id: z.string().nullable().optional().or(z.literal('')),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required for a purchase"),
  payment_type: z.enum(['CASH', 'TRANSFER', 'CREDIT', 'OTHER']).optional().default('CASH'),
  paid_amount: z.number().min(0),
  due_date: z.string().nullable().optional().or(z.literal('')),
  purchase_date: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().max(500).optional().nullable(),
});

// ──────────────────────────────────────────────────────────
// Expense Validation Schema
// ──────────────────────────────────────────────────────────
export const createExpenseSchema = z.object({
  category_id: z.string().nullable().optional().or(z.literal('')),
  amount: z.number().min(1, "Amount must be greater than 0"),
  payment_method: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  expense_date: z.string().optional().nullable().or(z.literal('')),
});
