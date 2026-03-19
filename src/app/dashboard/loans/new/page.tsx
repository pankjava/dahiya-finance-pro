"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { calculateLoan } from "@/lib/loanCalculations";
import { formatCurrency } from "@/lib/utils";

const LOAN_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "meter", label: "Meter" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export default function NewLoanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get("clientId") || "";
  const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);
  const [clientIdSel, setClientIdSel] = useState(clientId);
  const [principal, setPrincipal] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [interestRatePerMonth, setInterestRatePerMonth] = useState("");
  const [loanType, setLoanType] = useState<"daily" | "meter" | "weekly" | "monthly">("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof calculateLoan> | null>(null);

  useEffect(() => {
    async function fetchClients() {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        if (clientId && !clientIdSel) setClientIdSel(clientId);
      }
    }
    fetchClients();
  }, [clientId]);

  useEffect(() => {
    const p = parseFloat(principal);
    const d = parseInt(durationDays, 10);
    const r = parseFloat(interestRatePerMonth);
    if (!Number.isNaN(p) && p > 0 && !Number.isNaN(d) && d > 0 && !Number.isNaN(r) && r >= 0) {
      const result = calculateLoan({
        principal: p,
        durationDays: d,
        interestRatePerMonth: r,
        loanType,
        startDate: new Date(startDate),
      });
      setPreview(result);
    } else {
      setPreview(null);
    }
  }, [principal, durationDays, interestRatePerMonth, loanType, startDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const p = parseFloat(principal);
    const d = parseInt(durationDays, 10);
    const r = parseFloat(interestRatePerMonth);
    if (!clientIdSel) {
      setError("Select a client");
      return;
    }
    if (Number.isNaN(p) || p <= 0 || Number.isNaN(d) || d <= 0 || Number.isNaN(r) || r < 0) {
      setError("Invalid amount, duration or rate");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientIdSel,
          principal: p,
          durationDays: d,
          interestRatePerMonth: r,
          loanType,
          startDate: new Date(startDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create loan");
        return;
      }
      router.push(`/dashboard/loans/${data.loan._id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={clientId ? `/dashboard/clients/${clientId}` : "/dashboard/loans"} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">New Loan</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client *</label>
          <select
            value={clientIdSel}
            onChange={(e) => setClientIdSel(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loan Type *</label>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Principal (₹) *</label>
            <input
              type="number"
              min="1"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (days) *</label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interest (% per month) *</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={interestRatePerMonth}
              onChange={(e) => setInterestRatePerMonth(e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
            required
          />
        </div>
        {preview && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
            <p className="font-medium text-slate-800 dark:text-slate-100">Preview</p>
            <p>Total Interest: {formatCurrency(preview.totalInterest)}</p>
            <p>Total Payable: {formatCurrency(preview.totalPayable)}</p>
            {preview.dailyAmount != null && <p>Daily: {formatCurrency(preview.dailyAmount)}</p>}
            {preview.weeklyAmount != null && <p>Weekly: {formatCurrency(preview.weeklyAmount)}</p>}
            {preview.monthlyAmount != null && <p>Monthly: {formatCurrency(preview.monthlyAmount)}</p>}
            {preview.dailyInterestOnly != null && <p>Daily interest only: {formatCurrency(preview.dailyInterestOnly)}</p>}
          </div>
        )}
        <div className="flex gap-3">
          <Link href="/dashboard/loans" className="btn-secondary flex-1">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Creating…" : "Create Loan"}
          </button>
        </div>
      </form>
    </div>
  );
}
