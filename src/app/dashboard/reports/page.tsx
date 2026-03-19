"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileBarChart, Download } from "lucide-react";

type ReportType = "daily" | "weekly" | "monthly" | "loanType" | "paymentMode" | "bankWise";

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function runReport() {
    setLoading(true);
    try {
      let url = `/api/reports?type=${type}`;
      if (type === "daily" || type === "weekly" || type === "monthly") url += `&date=${date}`;
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
      else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runReport();
  }, [type, date]);

  function exportExcel() {
    if (!data || typeof data !== "object") return;
    const d = data as { payments?: { amount: number; paidAt: string; method: string; loanId?: { clientId?: { name: string } } }[]; total?: number; breakdown?: { _id: string; total: number; count?: number }[] };
    let csv = "";
    if (d.payments && d.payments.length > 0) {
      csv = "Date,Amount,Method,Client\n";
      d.payments.forEach((p) => {
        const client = typeof p.loanId === "object" && p.loanId?.clientId && typeof p.loanId.clientId === "object" ? p.loanId.clientId.name : "";
        csv += `${p.paidAt},${p.amount},${p.method},${client}\n`;
      });
      if (d.total != null) csv += `\nTotal,${d.total}\n`;
    } else if (d.breakdown && d.breakdown.length > 0) {
      csv = "Type,Total,Count\n";
      d.breakdown.forEach((b) => {
        csv += `${b._id},${b.total},${b.count ?? ""}\n`;
      });
    }
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report-${type}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reports</h1>

      <div className="card p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Report type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ReportType)} className="input-field w-48">
              <option value="daily">Daily Collection</option>
              <option value="weekly">Weekly Collection</option>
              <option value="monthly">Monthly Collection</option>
              <option value="loanType">Loan Type-wise</option>
              <option value="paymentMode">Payment Mode (Cash vs UPI)</option>
              <option value="bankWise">Bank-wise UPI</option>
            </select>
          </div>
          {(type === "daily" || type === "weekly" || type === "monthly") && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field w-40" />
            </div>
          )}
          <button onClick={runReport} className="btn-secondary">Refresh</button>
          <button onClick={exportExcel} className="btn-primary">
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="card p-6">
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : !data ? (
          <p className="text-slate-500">No data</p>
        ) : (
          <ReportContent data={data} type={type} />
        )}
      </div>
    </div>
  );
}

function ReportContent({ data, type }: { data: unknown; type: ReportType }) {
  const d = data as {
    total?: number;
    payments?: { amount: number; paidAt: string; method: string; loanId?: { clientId?: { name: string }; loanType?: string } }[];
    breakdown?: { _id: string; total: number; count?: number; upiId?: string }[];
  };
  if (type === "daily" || type === "weekly" || type === "monthly") {
    const payments = d.payments || [];
    return (
      <div>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Total: {formatCurrency(d.total ?? 0)}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-semibold">Date</th>
                <th className="text-left px-4 py-2 text-sm font-semibold">Amount</th>
                <th className="text-left px-4 py-2 text-sm font-semibold">Method</th>
                <th className="text-left px-4 py-2 text-sm font-semibold">Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {payments.map((p, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{formatDate(p.paidAt)}</td>
                  <td className="px-4 py-2">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-2 capitalize">{p.method}</td>
                  <td className="px-4 py-2">
                    {typeof p.loanId === "object" && p.loanId?.clientId && typeof p.loanId.clientId === "object"
                      ? p.loanId.clientId.name
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  const breakdown = d.breakdown || [];
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-semibold">Name</th>
              <th className="text-left px-4 py-2 text-sm font-semibold">Total</th>
              {type === "bankWise" && <th className="text-left px-4 py-2 text-sm font-semibold">UPI ID</th>}
              <th className="text-left px-4 py-2 text-sm font-semibold">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {breakdown.map((b) => (
              <tr key={b._id}>
                <td className="px-4 py-2 font-medium">{b._id}</td>
                <td className="px-4 py-2">{formatCurrency(b.total)}</td>
                {type === "bankWise" && b.upiId && <td className="px-4 py-2 text-slate-500">{b.upiId}</td>}
                <td className="px-4 py-2">{b.count ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
