"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Receipt, Banknote, Smartphone } from "lucide-react";

interface Payment {
  _id: string;
  amount: number;
  paidAt: string;
  method: string;
  bankName?: string;
  referenceNote?: string;
  loanId: { _id: string; clientId?: { name: string }; loanType?: string };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      try {
        let url = "/api/payments?";
        if (from) url += `from=${encodeURIComponent(from)}&`;
        if (to) url += `to=${encodeURIComponent(to)}&`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [from, to]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Payments</h1>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-40" />
        </div>
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-40" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No payments in this range.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Date & Time</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Method</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Client / Loan</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{formatDateTime(p.paidAt)}</td>
                    <td className="px-6 py-4 font-medium text-emerald-700 dark:text-emerald-400">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4">
                      {p.method === "cash" ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Banknote className="w-4 h-4" /> Cash
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
                          <Smartphone className="w-4 h-4" /> UPI {p.bankName && `(${p.bankName})`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {typeof p.loanId === "object" && p.loanId?.clientId && typeof p.loanId.clientId === "object"
                        ? p.loanId.clientId.name
                        : "—"}{" "}
                      {typeof p.loanId === "object" && p.loanId?.loanType && (
                        <span className="text-slate-500 text-sm">({p.loanId.loanType})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{p.referenceNote || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
