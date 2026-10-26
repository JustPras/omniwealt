import { Liability, Account } from '../types';

export interface TrueNetWorthSummary {
  grossAssets: number;
  totalLiabilities: number;
  trueNetWorth: number;
  debtToAssetRatioPercent: number;
}

export interface CreditUtilizationInfo {
  usedAmount: number;
  creditLimit: number;
  utilizationPercent: number;
  isHighUtilization: boolean; // > 30% usually impacts credit health
}

export interface DueLiabilityAlert {
  liability: Liability;
  daysLeft: number;
  dueDate: number;
  isDueToday: boolean;
  isOverdue: boolean;
  isDueSoon: boolean; // within 7 days
}

export class LiabilityService {
  /**
   * Calculate True Net Worth: Total Assets - Total Liabilities
   */
  static calculateTrueNetWorth(grossAssets: number, liabilities: Liability[]): TrueNetWorthSummary {
    const totalLiabilities = liabilities.reduce(
      (sum, l) => sum + (Number(l.outstandingAmount) || 0),
      0
    );
    const trueNetWorth = grossAssets - totalLiabilities;
    const debtToAssetRatioPercent =
      grossAssets > 0 ? (totalLiabilities / grossAssets) * 100 : totalLiabilities > 0 ? 100 : 0;

    return {
      grossAssets,
      totalLiabilities,
      trueNetWorth,
      debtToAssetRatioPercent: Math.round(debtToAssetRatioPercent * 10) / 10,
    };
  }

  /**
   * Calculate credit utilization ratio for Credit Cards & PayLater
   */
  static calculateUtilization(outstanding: number, limit?: number): CreditUtilizationInfo {
    const validLimit = Math.max(0, Number(limit) || 0);
    const used = Math.max(0, Number(outstanding) || 0);

    if (validLimit === 0) {
      return {
        usedAmount: used,
        creditLimit: 0,
        utilizationPercent: 0,
        isHighUtilization: false,
      };
    }

    const ratio = Math.min(100, Math.round((used / validLimit) * 100));

    return {
      usedAmount: used,
      creditLimit: validLimit,
      utilizationPercent: ratio,
      isHighUtilization: ratio > 30, // Financial standard: > 30% is high
    };
  }

  /**
   * Check upcoming bills based on monthly due date (1-31)
   */
  static getDueAlerts(liabilities: Liability[], referenceDate: Date = new Date()): DueLiabilityAlert[] {
    const currentDay = referenceDate.getDate();

    return liabilities
      .filter((l) => l.outstandingAmount > 0 && typeof l.dueDate === 'number' && l.dueDate >= 1)
      .map((l) => {
        const due = l.dueDate!;
        let daysLeft = due - currentDay;

        // If today is past the due date in this month, check if it's overdue or next month
        // In Indonesian consumer finance, if unpaid by current day > due date, it's overdue
        const isOverdue = currentDay > due;
        const isDueToday = currentDay === due;
        const isDueSoon = !isOverdue && daysLeft >= 0 && daysLeft <= 7;

        return {
          liability: l,
          daysLeft,
          dueDate: due,
          isDueToday,
          isOverdue,
          isDueSoon,
        };
      })
      .sort((a, b) => {
        // Sort priority: overdue first, then due today, then closest daysLeft
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isDueToday && !b.isDueToday) return -1;
        if (!a.isDueToday && b.isDueToday) return 1;
        return a.daysLeft - b.daysLeft;
      });
  }

  /**
   * Validate and simulate bill payment
   */
  static validatePayment(
    liability: Liability,
    sourceAccount: Account,
    amount: number
  ): {
    isValid: boolean;
    remainingLiability: number;
    remainingAccountBalance: number;
    error?: string;
  } {
    if (amount <= 0) {
      return {
        isValid: false,
        remainingLiability: liability.outstandingAmount,
        remainingAccountBalance: sourceAccount.balance,
        error: 'Nominal pembayaran harus lebih besar dari Rp 0',
      };
    }

    if (sourceAccount.balance < amount) {
      return {
        isValid: false,
        remainingLiability: liability.outstandingAmount,
        remainingAccountBalance: sourceAccount.balance,
        error: `Saldo ${sourceAccount.name} tidak mencukupi`,
      };
    }

    const remainingLiability = Math.max(0, liability.outstandingAmount - amount);
    const remainingAccountBalance = sourceAccount.balance - amount;

    return {
      isValid: true,
      remainingLiability,
      remainingAccountBalance,
    };
  }
}
