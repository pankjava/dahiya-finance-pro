"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Calculator as CalcIcon } from "lucide-react";
import { calculateLoan } from "@/lib/loanCalculations";

const LOAN_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "meter", label: "Meter" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export default function CalculatorPage() {
  const [principal, setPrincipal] = useState("20000");
  const [durationDays, setDurationDays] = useState("60");
  const [interestRatePerMonth, setInterestRatePerMonth] = useState("10");
  const [loanType, setLoanType] = useState<"daily" | "meter" | "weekly" | "monthly">("monthly");

  const result = useMemo(() => {
    const p = parseFloat(principal);
    const d = parseInt(durationDays, 10);
    const r = parseFloat(interestRatePerMonth);
    if (Number.isNaN(p) || p <= 0 || Number.isNaN(d) || d <= 0 || Number.isNaN(r) || r < 0) return null;
    return calculateLoan({
      principal: p,
      durationDays: d,
      interestRatePerMonth: r,
      loanType,
      startDate: new Date(),
    });
  }, [principal, durationDays, interestRatePerMonth, loanType]);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <CalcIcon className="w-8 h-8 text-emerald-500" />
        Loan Calculator
      </h1>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loan Amount (₹)</label>
          <input
            type="number"
            min="1"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (days)</label>
          <input
            type="number"
            min="1"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interest Rate (% per month)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={interestRatePerMonth}
            onChange={(e) => setInterestRatePerMonth(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loan Type</label>
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value as typeof loanType)}
            className="input-field"
          >
            {LOAN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <div className="card p-6 border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Result</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">Total Interest</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{formatCurrency(result.totalInterest)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">Total Payable</dt>
              <dd className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(result.totalPayable)}</dd>
            </div>
            {result.dailyAmount != null && (
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Daily payment</dt>
                <dd className="font-medium">{formatCurrency(result.dailyAmount)}</dd>
              </div>
            )}
            {result.weeklyAmount != null && (
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Weekly payment</dt>
                <dd className="font-medium">{formatCurrency(result.weeklyAmount)}</dd>
              </div>
            )}
            {result.monthlyAmount != null && (
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Monthly payment</dt>
                <dd className="font-medium">{formatCurrency(result.monthlyAmount)}</dd>
              </div>
            )}
            {result.dailyInterestOnly != null && (
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Daily interest only</dt>
                <dd className="font-medium">{formatCurrency(result.dailyInterestOnly)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
