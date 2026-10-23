export type TransactionType = 'expense' | 'income';

export type KhataType = 'gave' | 'took'; // 'gave' = You Will Get (पैसे मिलेंगे), 'took' = You Will Give (पैसे देने हैं)

export type KhataEntry = {
  id: string;
  personName: string;
  phone?: string;
  amount: number;
  type: KhataType;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  status: 'pending' | 'settled';
};

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking';

export type CategoryName =
  | 'Food'
  | 'Shopping'
  | 'Travel'
  | 'Bills'
  | 'Entertainment'
  | 'Health'
  | 'Education'
  | 'Rent'
  | 'EMI'
  | 'Fuel'
  | 'Groceries'
  | 'Subscriptions'
  | 'Other';

export type CategoryBudget = {
  category: CategoryName;
  limit: number;
};

export type TransactionScope = 'Personal' | 'Work' | 'Family';

export type Transaction = {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: CategoryName;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  scope?: TransactionScope;
  people?: string[];
  notes?: string;
};

export type Deal = {
  id: string;
  title: string;
  platform: string;
  category: CategoryName | string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  couponCode?: string;
  cashbackText?: string;
  deliveryCharge: number;
  finalPrice: number;
  savingsAmount: number;
  expiryDate: string;
  bestReason: string;
  rating?: number;
  imageUrl?: string;
  tracked?: boolean;
  targetPrice?: number;
  dealUrl?: string;
  sourceUrl?: string;
  sourceType?: string;
  /** Set only on deals mapped from a live `GET /deals/search` result (see DealsViewContent) —
   * `'provider'` means `id` is a MerchantOffer id (the new provider-neutral engine), `'legacy'`
   * means `id` is a legacy `Deal` id. Undefined (e.g. from the plain `GET /deals` list) is
   * treated as legacy, since that list is always legacy-`Deal`-collection-backed. Used to pick
   * the correct backend route for actions like setting a price alert — see
   * `SetPriceAlertSheet.tsx`. */
  sourceEngine?: 'provider' | 'legacy';
  verifiedAt?: string;
  lastCheckedAt?: string;
  priceVerified?: boolean;
  urlVerified?: boolean;
  offerConditions?: string[];
  aiReason?: string;
  purchaseCheck?: {
    status: 'SAFE' | 'WAIT';
    reason: string;
  };
  dealScore?: number;
  relevanceScore?: number;
  confidence?: number;
};

export type Frequency = 'Monthly' | 'Quarterly' | 'Yearly' | 'One-time';

export type BillReminder = {
  id: string;
  title: string;
  category: CategoryName;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  reminderDate: string; // YYYY-MM-DD
  frequency: Frequency;
  status: 'pending' | 'paid';
  notes?: string;
  /** Settled occurrences of a recurring bill, oldest first (paying rolls dueDate forward). */
  payments?: { dueDate: string; paidAt: string; amount: number }[];
};

export type BillingCycle = 'Monthly' | 'Yearly';

export type Subscription = {
  id: string;
  name: string;
  category: CategoryName;
  amount: number;
  billingCycle: BillingCycle;
  nextBillingDate: string; // YYYY-MM-DD
  annualCost: number;
  icon: string;
  isRedundant?: boolean;
  redundancyReason?: string;
};

export type PlannerTaskPriority = 'low' | 'medium' | 'high';
export type PlannerTaskStatus = 'todo' | 'done';

export type PlannerTask = {
  id: string;
  title: string;
  notes?: string;
  dueDate: string;
  dueTime?: string;
  status: PlannerTaskStatus;
  priority: PlannerTaskPriority;
};

export type ChatActionType =
  | 'deal_recommendation'
  | 'reminder_set'
  | 'reminder_action'
  | 'expense_added'
  | 'savings_summary'
  | 'affordability_check'
  | 'subscription_action';

export interface AffordabilityPayload {
  item: string;
  requestedAmount: number;
  verdict: 'safe' | 'caution' | 'danger';
  verdictTitle: string;
  verdictSubtitle: string;
  metrics: {
    currentBalance: number;
    upcomingBills: number;
    budgetRemaining: number;
    safeSpendingLimit: number;
  };
  warning?: string;
  actionButton?: {
    label: string;
    action: 'search_deals' | 'view_bills' | 'view_budgets';
    params?: {
      query?: string;
      maxPrice?: number;
    };
  };
}

export type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionType?: ChatActionType;
  payload?: unknown;
};

export type NotificationType = 'bill' | 'deal' | 'price_drop' | 'insight' | 'activity';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  time: string;
  read: boolean;
};

export type MonthlySavingsPoint = {
  month: string;
  amount: number;
};

export type SavingsMetrics = {
  totalSaved: number;
  currentMonthSaved: number;
  previousMonthSaved: number;
  dealSavings: number;
  couponSavings: number;
  cashback: number;
  avoidedExpenses: number;
  potentialSavings: number;
  monthlyHistory: MonthlySavingsPoint[];
};

export type GroupMember = {
  id: string;
  name: string;
  phone?: string;
  linkedUserId?: string | null;
  status?: 'ghost' | 'registered';
  isCurrentUser?: boolean;
};

export type GroupExpenseSplit = {
  memberName: string;
  amount: number;
  /** Equal split: portions (1× default, 2× = twice the share). */
  shares?: number;
  confirmedTransactionId?: string;
};

export type PendingGroupConfirmation = {
  groupId: string;
  groupName: string;
  expenseId: string;
  title: string;
  date: string;
  amount: number;
  paidBy: string;
  isPayer: boolean;
  suggestedCategory: CategoryName;
};

export type SplitType = 'equal' | 'shares' | 'exact' | 'percentage';

export type GroupExpense = {
  id: string;
  groupId: string;
  title: string;
  totalAmount: number;
  paidBy: string;
  date: string;
  splits: GroupExpenseSplit[];
  notes?: string;
  splitType?: SplitType;
  isSettlement?: boolean;
  settlementFrom?: string;
  settlementTo?: string;
};

export type ExpenseGroup = {
  id: string;
  name: string;
  category: 'Travel' | 'Home & Utilities' | 'Event & Party' | 'Office & Work' | 'Other';
  inviteCode?: string;
  isOwner?: boolean;
  currentMemberName?: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  createdAt: string;
  /** Splitwise-style "Simplify group debts" (on unless switched off). */
  simplifyDebts?: boolean;
};

export type DealSearchStatus = 'success' | 'unavailable' | 'error';

/**
 * One item in `GET /deals/search`'s new envelope — not the same shape as `Deal` (which still
 * backs the plain `/deals` list): keyed by `offerId`/`productId` rather than `id`, and carries
 * fields the old shape doesn't (`stale`, `isAllTimeLow`, `alerted`, …). Not yet rendered by any
 * screen — the Deals tab still reads from `Deal`/`GET /deals` — but typed accurately so a future
 * screen can consume it directly instead of guessing its shape.
 */
export type MerchantDeal = {
  offerId: string;
  productId: string;
  title: string;
  platform: string;
  category: string;
  brand?: string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  couponCode?: string;
  cashbackText?: string;
  deliveryCharge: number;
  finalPrice: number;
  savingsAmount: number;
  rating?: number;
  imageUrl?: string;
  dealUrl: string;
  sourceType: string;
  priceVerified: boolean;
  urlVerified: boolean;
  observedAt: string;
  stale: boolean;
  isAllTimeLow: boolean;
  lowestObservedPrice: number | null;
  dealScore: number;
  alerted: boolean;
  targetPrice?: number;
};

/**
 * `GET /deals/search`'s response envelope. Distinguishes "no verified marketplace data
 * available" (`status: 'unavailable'`, real providers only, never AI-generated) from an actual
 * failure (`'error'`) — see TrackKaro-backend's `src/modules/deals/engine/types.ts`.
 */
export type DealSearchResponse = {
  status: DealSearchStatus;
  engine: 'provider' | 'legacy';
  message?: string;
  deals: MerchantDeal[];
};

export type GroupInvitePreview = {
  id: string;
  name: string;
  category: string;
  inviteCode: string;
  members: { id: string; name: string; isClaimed: boolean }[];
};
