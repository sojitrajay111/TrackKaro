export type CategoryName =
  | "Food"
  | "Shopping"
  | "Travel"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Education"
  | "Rent"
  | "EMI"
  | "Fuel"
  | "Groceries"
  | "Subscriptions"
  | "Other";

export type PaymentMethod = "UPI" | "Credit Card" | "Debit Card" | "Cash" | "Net Banking";
export type TransactionScope = "Personal" | "Work" | "Family";

export interface Transaction {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  type: "expense" | "income";
  category: CategoryName;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  scope?: TransactionScope;
  notes?: string;
}

export type KhataType = "gave" | "took"; // 'gave' = You Will Get, 'took' = You Will Give

export interface KhataEntry {
  id: string;
  personName: string;
  phone?: string;
  amount: number;
  type: KhataType;
  date: string;
  dueDate?: string;
  notes?: string;
  status: "pending" | "settled";
}

export interface CategoryBudget {
  category: CategoryName;
  limit: number;
}

export interface BillReminder {
  id: string;
  title: string;
  category: CategoryName;
  amount: number;
  dueDate: string;
  reminderDate: string;
  frequency: "Monthly" | "Quarterly" | "Yearly" | "One-time";
  status: "pending" | "paid";
  notes?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  phone?: string;
  linkedUserId?: string | null;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  category: "Travel" | "Home & Utilities" | "Event & Party" | "Office & Work" | "Other";
  inviteCode?: string;
  members: GroupMember[];
}

export interface Deal {
  id: string;
  title: string;
  platform: string;
  category: string;
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  couponCode?: string;
  deliveryCharge?: number;
  finalPrice: number;
  savingsAmount: number;
  rating?: number;
  imageUrl?: string;
  dealUrl?: string;
  purchaseCheck?: {
    status: "SAFE" | "WAIT";
    reason: string;
  };
}
