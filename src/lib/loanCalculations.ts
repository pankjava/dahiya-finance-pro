import type { LoanType } from "@/models/Loan";
import { addDays, addWeeks, addMonths, differenceInDays } from "date-fns";

export interface LoanCalculationInput {
  principal: number;
  durationDays: number;
  interestRatePerMonth: number;
  loanType: LoanType;
  startDate: Date;
}

export interface LoanCalculationResult {
  totalInterest: number;
  totalPayable: number;
  dailyAmount?: number;
  weeklyAmount?: number;
  monthlyAmount?: number;
  dailyInterestOnly?: number; // for meter
  schedule: { dueDate: Date; amount: number }[];
}

export function calculateLoan(input: LoanCalculationInput): LoanCalculationResult {
  const { principal, durationDays, interestRatePerMonth, loanType, startDate } = input;
  const totalInterest = (principal * (interestRatePerMonth / 100) * durationDays) / 30;
  const totalPayable = principal + totalInterest;
  const endDate = addDays(startDate, durationDays);
  const schedule: { dueDate: Date; amount: number }[] = [];

  switch (loanType) {
    case "daily": {
      const dailyAmount = Math.round(totalPayable / durationDays);
      let d = new Date(startDate);
      while (d <= endDate) {
        schedule.push({ dueDate: new Date(d), amount: dailyAmount });
        d = addDays(d, 1);
      }
      return {
        totalInterest,
        totalPayable,
        dailyAmount,
        schedule,
      };
    }

    case "meter": {
      const dailyInterestOnly = Math.round(totalInterest / durationDays);
      let d = new Date(startDate);
      while (d < endDate) {
        schedule.push({ dueDate: new Date(d), amount: dailyInterestOnly });
        d = addDays(d, 1);
      }
      schedule.push({ dueDate: new Date(endDate), amount: principal }); // principal at end
      return {
        totalInterest,
        totalPayable,
        dailyInterestOnly,
        schedule,
      };
    }

    case "weekly": {
      const weeks = Math.ceil(durationDays / 7);
      const weeklyAmount = Math.round(totalPayable / weeks);
      let d = new Date(startDate);
      for (let i = 0; i < weeks; i++) {
        schedule.push({ dueDate: new Date(d), amount: weeklyAmount });
        d = addWeeks(d, 1);
      }
      return {
        totalInterest,
        totalPayable,
        weeklyAmount,
        schedule,
      };
    }

    case "monthly": {
      const months = Math.ceil(durationDays / 30);
      const monthlyAmount = Math.round(totalPayable / months);
      let d = new Date(startDate);
      for (let i = 0; i < months; i++) {
        schedule.push({ dueDate: new Date(d), amount: monthlyAmount });
        d = addMonths(d, 1);
      }
      return {
        totalInterest,
        totalPayable,
        monthlyAmount,
        schedule,
      };
    }

    default:
      return { totalInterest, totalPayable, schedule };
  }
}

export function getScheduleStatus(dueDate: Date, paidAt?: Date): "paid" | "upcoming" | "missed" {
  if (paidAt) return "paid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  if (due < today) return "missed";
  return "upcoming";
}
