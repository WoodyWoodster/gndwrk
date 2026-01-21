// User types
export type UserRole = "parent" | "kid";

export type KycStatus = "pending" | "verified" | "failed";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role?: UserRole;
  familyId?: string;
  dateOfBirth?: number;
  kycStatus?: KycStatus;
  choresCompleted?: number;
  savingStreak?: number;
  loansRepaid?: number;
}

// Family types
export interface Family {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  createdAt: number;
  defaultAllocation?: AllocationSplit;
}

export interface AllocationSplit {
  spend: number;
  save: number;
  give: number;
  invest: number;
}

// Account types
export type BucketType = "spend" | "save" | "give" | "invest";

export interface Account {
  id: string;
  userId: string;
  familyId: string;
  type: BucketType;
  balance: number;
  goal?: number;
  goalName?: string;
  dailySpendLimit?: number;
  weeklySpendLimit?: number;
  monthlySpendLimit?: number;
}

// Transaction types
export type TransactionType = "credit" | "debit";
export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  familyId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  merchantName?: string;
  merchantCategory?: string;
  status: TransactionStatus;
  createdAt: number;
}

// Chore types
export type ChoreFrequency = "once" | "daily" | "weekly";
export type ChoreStatus = "open" | "claimed" | "pending_approval" | "completed" | "paid";

export interface Chore {
  id: string;
  familyId: string;
  createdBy: string;
  title: string;
  description: string;
  payout: number;
  frequency: ChoreFrequency;
  assignedTo?: string;
  status: ChoreStatus;
  dueDate?: number;
  completedAt?: number;
  approvedAt?: number;
  proofPhotoUrl?: string;
  createdAt: number;
}

// Loan types
export type LoanStatus = "pending" | "active" | "paid" | "defaulted";

export interface Loan {
  id: string;
  familyId: string;
  lenderId: string;
  borrowerId: string;
  principal: number;
  interestRate: number;
  termWeeks: number;
  weeklyPayment: number;
  purpose: string;
  status: LoanStatus;
  remainingBalance: number;
  nextPaymentDate?: number;
  createdAt: number;
  approvedAt?: number;
  paidOffAt?: number;
}

export type LoanPaymentStatus = "scheduled" | "paid" | "late" | "missed";

export interface LoanPayment {
  id: string;
  loanId: string;
  userId: string;
  amount: number;
  principal: number;
  interest: number;
  dueDate: number;
  paidDate?: number;
  onTime?: boolean;
  status: LoanPaymentStatus;
}

// Trust Score types
export type TrustScoreEventType =
  | "loan_payment_on_time"
  | "loan_payment_late"
  | "loan_paid_early"
  | "loan_defaulted"
  | "chore_completed"
  | "savings_goal_reached"
  | "savings_streak"
  | "overspent_budget"
  | "giving_donation"
  | "parent_endorsement"
  | "account_age";

export interface TrustScoreEvent {
  id: string;
  userId: string;
  familyId: string;
  event: string;
  eventType: TrustScoreEventType;
  points: number;
  createdAt: number;
}

export interface TrustScoreFactors {
  loanRepayment: number;
  savingsConsistency: number;
  choreCompletion: number;
  budgetAdherence: number;
  givingBehavior: number;
  accountAge: number;
  parentEndorsements: number;
}

export interface TrustScore {
  id: string;
  userId: string;
  score: number;
  factors: TrustScoreFactors;
  calculatedAt: number;
}

// AI types
export type MessageRole = "user" | "assistant";

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

// Savings Goal types
export type SavingsGoalStatus = "active" | "completed" | "cancelled";

export interface SavingsGoal {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: number;
  imageUrl?: string;
  status: SavingsGoalStatus;
  createdAt: number;
  completedAt?: number;
}

// Trust Score tier benefits
export interface TrustScoreTier {
  name: "excellent" | "good" | "building" | "new";
  minScore: number;
  loanRateDiscount: number;
  cashbackBoost: number;
  prioritySupport: boolean;
}

export const TRUST_SCORE_TIERS: TrustScoreTier[] = [
  { name: "excellent", minScore: 750, loanRateDiscount: 2.0, cashbackBoost: 0.5, prioritySupport: true },
  { name: "good", minScore: 650, loanRateDiscount: 1.0, cashbackBoost: 0.25, prioritySupport: false },
  { name: "building", minScore: 550, loanRateDiscount: 0.5, cashbackBoost: 0, prioritySupport: false },
  { name: "new", minScore: 0, loanRateDiscount: 0, cashbackBoost: 0, prioritySupport: false },
];

export function getTrustScoreTier(score: number): TrustScoreTier {
  return TRUST_SCORE_TIERS.find(tier => score >= tier.minScore) ?? TRUST_SCORE_TIERS[TRUST_SCORE_TIERS.length - 1];
}
