import axios from 'axios';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
});


// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
  (config) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop on auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );


        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- Named API functions ---

export const updateProfile = (name: string) =>
  api.put('/auth/profile', { name });

export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  api.put('/auth/change-password', data);

// --- Categories API ---

export const getCategories = () => api.get('/categories');

export const createCategory = (name: string) => api.post('/categories', { name });

export const updateCategory = (id: string, name: string) => api.put(`/categories/${id}`, { name });

export const deleteCategory = (id: string) => api.delete(`/categories/${id}`);

// --- Items API ---

export const getItems = () => api.get('/items');

export const createItem = (data: {
  name: string;
  category_id?: string;
  unit: string;
  price?: number;
  sell_price?: number;
  buy_price?: number;
  stock: number;
  description?: string;
}) => api.post('/items', data);

export const updateItem = (
  id: string,
  data: {
    name: string;
    category_id?: string;
    unit: string;
    price?: number;
    sell_price?: number;
    buy_price?: number;
    stock: number;
    description?: string;
  }
) => api.put(`/items/${id}`, data);

export const deleteItem = (id: string) => api.delete(`/items/${id}`);

// --- Customers API ---

export interface Customer {
  id: string;
  user_id?: string;
  name: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export const getCustomers = () => api.get('/customers');

export const createCustomer = (data: { name: string; phone?: string; address?: string }) =>
  api.post('/customers', data);

// --- Sales API ---

export interface SaleLineItem {
  item_id: string;
  quantity: number;
  price: number;
  cost_price?: number;
  discount?: number;
}

export const createSale = (data: {
  items: SaleLineItem[];
  customer_id?: string | null;
  payment_type: 'CASH' | 'TRANSFER' | 'CREDIT';
  paid_amount: number;
  due_date?: string | null;
  sale_date?: string | null;
  shipping_cost?: number;
  notes?: string;
}) => api.post('/sales', data);

export const getSales = (params?: { startDate?: string; endDate?: string }) =>
  api.get('/sales', { params });

export const voidSale = (id: string) => api.delete(`/sales/${id}`);

export const payCustomerDebt = (
  id: string,
  data: {
    amount: number;
    payment_method: 'CASH' | 'TRANSFER';
    payment_date?: string;
    notes?: string;
  }
) => api.post(`/sales/${id}/pay-debt`, data);

export const deleteCustomerDebtPayment = (paymentId: string) =>
  api.delete(`/sales/debt-payments/${paymentId}`);

// --- Suppliers API ---
export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  notes?: string;
  created_at?: string;
}

export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data: Partial<Supplier>) => api.post('/suppliers', data);
export const updateSupplier = (id: string, data: Partial<Supplier>) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id: string) => api.delete(`/suppliers/${id}`);

// --- Purchases API ---
export interface PurchaseLineItem {
  item_id: string;
  quantity: number;
  unit_price: number;
}

export const createPurchase = (data: {
  supplier_id?: string | null;
  items: PurchaseLineItem[];
  payment_type: 'CASH' | 'TRANSFER' | 'CREDIT';
  paid_amount: number;
  due_date?: string | null;
  purchase_date?: string | null;
  notes?: string;
}) => api.post('/purchases', data);

export const getPurchases = (params?: { startDate?: string; endDate?: string }) =>
  api.get('/purchases', { params });

export const getPurchaseById = (id: string) => api.get(`/purchases/${id}`);

export const cancelPurchase = (id: string) => api.delete(`/purchases/${id}`);

export const paySupplierDebt = (
  id: string,
  data: {
    amount: number;
    payment_method: 'CASH' | 'TRANSFER';
    payment_date?: string;
    notes?: string;
  }
) => api.post(`/purchases/${id}/pay-debt`, data);

export const deleteSupplierDebtPayment = (paymentId: string) =>
  api.delete(`/purchases/debt-payments/${paymentId}`);

// --- Inventory (Returns & Stock Opname) API ---
export const createReturn = (data: {
  return_type: 'TO_SUPPLIER' | 'FROM_CUSTOMER';
  reference_id?: string | null;
  item_id: string;
  quantity: number;
  reason?: string;
  return_date?: string | null;
  supplier_id?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
}) => api.post('/returns', data);

export const getReturns = () => api.get('/returns');
export const deleteReturn = (id: string) => api.delete(`/returns/${id}`);

export const createStockOpname = (data: {
  item_id: string;
  physical_stock: number;
  notes?: string;
  opname_date?: string | null;
}) => api.post('/stock-opname', data);

export const getStockOpnames = () => api.get('/stock-opname');
export const deleteStockOpname = (id: string) => api.delete(`/stock-opname/${id}`);

// --- Expense Categories API ---
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export const getExpenseCategories = () => api.get('/expense-categories');
export const createExpenseCategory = (data: { name: string; description?: string }) =>
  api.post('/expense-categories', data);
export const updateExpenseCategory = (id: string, data: { name: string; description?: string }) =>
  api.put(`/expense-categories/${id}`, data);
export const deleteExpenseCategory = (id: string) => api.delete(`/expense-categories/${id}`);

// --- Expenses API ---
export interface Expense {
  id: string;
  category_id?: string | null;
  category_name?: string;
  category?: ExpenseCategory | null;
  amount: number;
  payment_method: 'Cash' | 'Transfer';
  expense_date: string;
  notes?: string;
  created_at?: string;
}

export const getExpenses = (params?: { startDate?: string; endDate?: string }) =>
  api.get('/expenses', { params });
export const createExpense = (data: {
  category_id?: string | null;
  amount: number;
  payment_method: 'Cash' | 'Transfer';
  expense_date?: string;
  notes?: string;
}) => api.post('/expenses', data);
export const updateExpense = (
  id: string,
  data: {
    category_id?: string | null;
    amount: number;
    payment_method: 'Cash' | 'Transfer';
    expense_date?: string;
    notes?: string;
  }
) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id: string) => api.delete(`/expenses/${id}`);

// --- Investors API ---
export interface Investor {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  investment_amount: number;
  share_percentage: number;
  notes?: string;
  created_at?: string;
}

export const getInvestors = () => api.get('/investors');
export const createInvestor = (data: {
  name: string;
  phone?: string;
  email?: string;
  investment_amount: number;
  share_percentage: number;
  notes?: string;
}) => api.post('/investors', data);
export const updateInvestor = (
  id: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    investment_amount: number;
    share_percentage: number;
    notes?: string;
  }
) => api.put(`/investors/${id}`, data);
export const deleteInvestor = (id: string) => api.delete(`/investors/${id}`);

export interface InvestorDividendItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  investment_amount: number;
  share_percentage: number;
  dividend_amount: number;
  notes?: string;
}

export interface DividendReportResponse {
  period: {
    startDate?: string | null;
    endDate?: string | null;
  };
  financial_summary: {
    revenue: number;
    cogs: number;
    gross_profit: number;
    operating_expenses: number;
    net_profit: number;
    cash_and_bank?: number;
    receivables?: number;
  };
  investor_summary: {
    total_investors: number;
    total_capital: number;
    total_share_percentage: number;
    total_distributed_dividends: number;
  };
  dividends: InvestorDividendItem[];
}

export const getInvestorDividends = (params?: { startDate?: string; endDate?: string }) =>
  api.get<DividendReportResponse>('/investors/dividends', { params });

// --- Financial Reports API ---
export interface FinancialReportData {
  period: {
    startDate?: string | null;
    endDate?: string | null;
  };
  income_statement: {
    revenue: number;
    cogs: number;
    gross_profit: number;
    gross_profit_margin_pct: string;
    operating_expenses: number;
    expenses_breakdown: Array<{
      category_name: string;
      total_amount: number;
      count: number;
    }>;
    net_profit: number;
    net_profit_margin_pct: string;
  };
  balance_sheet: {
    assets: {
      cash_and_bank: number;
      receivables: number;
      inventory_valuation: number;
      total_assets: number;
    };
    liabilities: {
      supplier_payables: number;
      total_liabilities: number;
    };
    equity: {
      investor_capital: number;
      retained_earnings: number;
      total_equity: number;
    };
    total_liabilities_and_equity: number;
    is_balanced: boolean;
  };
}

export interface JournalEntry {
  id: string;
  user_id: string;
  transaction_type: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'DEBT_PAYMENT' | 'OTHER';
  reference_id: string;
  transaction_date: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string | null;
  created_at: string;
}

export interface JournalReportResponse {
  journals: JournalEntry[];
  summary: {
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
    count: number;
  };
}

export const getFinancialReport = (params?: { startDate?: string; endDate?: string }) =>
  api.get<FinancialReportData>('/reports/financial', { params });

export const getJournals = (params?: { startDate?: string; endDate?: string; type?: string }) =>
  api.get<JournalReportResponse>('/reports/journals', { params });

// --- Dashboard Summary API ---
export interface DashboardSummaryResponse {
  month: string;
  summary: {
    total_revenue: number;
    total_expenses: number;
    total_cogs: number;
    net_profit: number;
    transaction_count: number;
  };
  daily_trend: Array<{
    date: string;
    day: number;
    revenue: number;
    expenses: number;
  }>;
  top_items: Array<{
    id: string;
    name: string;
    category?: string;
    unit: string;
    total_qty: number;
    total_revenue: number;
  }>;
}

export const getDashboardSummary = () =>
  api.get<DashboardSummaryResponse>('/reports/dashboard');

// --- Shipping Report API ---
export interface ShippingRecord {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string;
  customer_phone?: string | null;
  shipping_cost: number;
  payment_status: string;
}

export interface ShippingReportResponse {
  period: {
    startDate?: string | null;
    endDate?: string | null;
  };
  shipments: ShippingRecord[];
  total_shipping: number;
  total_count: number;
}

export const getShippingReport = (params?: { startDate?: string; endDate?: string }) =>
  api.get<ShippingReportResponse>('/reports/shipping', { params });

export default api;


