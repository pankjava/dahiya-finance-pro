"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Wallet, AlertCircle, Clock } from "lucide-react";

interface Loan {
  _id: string;
  clientId: { _id: string; name: string; mobile?: string };
  loanType: string;
  principal: number;
  totalPayable: number;
  startDate: string;
  endDate: string;
  status: string;
  dailyAmount?: number;
  weeklyAmount?: number;
  monthlyAmount?: number;
}

interface ActiveLoan extends Loan {
  remainingAmount?: number;
  nextPaymentDate?: string | null;
  nextPaymentAmount?: number | null;
  paymentStatus?: string;
}

export default function LoansPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || "";
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLoans() {
      setLoading(true);
      try {
        const url = clientId ? `/api/loans?clientId=${clientId}` : "/api/loans";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setLoans(data.loans || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLoans();
  }, [clientId]);

  useEffect(() => {
    if (clientId) return;
    fetch("/api/loans/active")
      .then((r) => r.json())
      .then((d) => setActiveLoans(d.loans || []))
      .catch(() => setActiveLoans([]));
  }, [clientId]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Loans</h1>
        <Link href={clientId ? `/dashboard/loans/new?clientId=${clientId}` : "/dashboard/loans/new"} className="btn-primary bg-[#001C3D] hover:bg-[#002347]">
          <Plus className="w-5 h-5" />
          New Loan
        </Link>
      </div>

      {!clientId && activeLoans.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            Active Loans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Client</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Loan Type</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Remaining</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Next Payment</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {activeLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/clients/${typeof loan.clientId === "object" ? loan.clientId._id : loan.clientId}`} className="font-medium text-[#001C3D] dark:text-amber-400 hover:underline">
                        {typeof loan.clientId === "object" ? loan.clientId.name : "—"}
                      </Link>
                    </td>
                    <td className="px-6 py-3 capitalize">{loan.loanType}</td>
                    <td className="px-6 py-3 font-medium">{formatCurrency(loan.remainingAmount ?? 0)}</td>
                    <td className="px-6 py-3">
                      {loan.nextPaymentDate ? (
                        <span>{formatDate(loan.nextPaymentDate)} ({formatCurrency(loan.nextPaymentAmount ?? 0)})</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {loan.paymentStatus === "overdue" ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4" /> Upcoming
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/loans/${loan._id}`} className="text-[#001C3D] dark:text-amber-400 hover:underline text-sm font-medium">
                        View & Pay →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {clientId ? "Loans for this client" : "All Loans"}
        </h2>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No loans yet. Create a loan from a client page.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Principal</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Total Payable</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Period</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/clients/${typeof loan.clientId === 'object' ? loan.clientId._id : loan.clientId}`} className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
                        {typeof loan.clientId === 'object' ? loan.clientId.name : '—'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 capitalize">{loan.loanType}</td>
                    <td className="px-6 py-4">{formatCurrency(loan.principal)}</td>
                    <td className="px-6 py-4">{formatCurrency(loan.totalPayable)}</td>
                    <td className="px-6 py-4">
                      {formatDate(loan.startDate)} – {formatDate(loan.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        loan.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        loan.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/loans/${loan._id}`} className="text-[#001C3D] dark:text-amber-400 hover:underline text-sm font-medium">
                        View & Pay →
                      </Link>
                    </td>
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
