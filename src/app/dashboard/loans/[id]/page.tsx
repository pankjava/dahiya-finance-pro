"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Check, Clock, XCircle, CheckCircle } from "lucide-react";

interface ScheduleItem {
  _id: string;
  dueDate: string;
  amount: number;
  carryForwardAmount?: number;
  status: string;
  paidAmount?: number;
  paidAt?: string;
}

interface Loan {
  _id: string;
  clientId: { _id: string; name: string };
  loanType: string;
  principal: number;
  totalPayable: number;
  totalInterest: number;
  startDate: string;
  endDate: string;
  status: string;
  dailyAmount?: number;
  weeklyAmount?: number;
  monthlyAmount?: number;
}

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receivedRow, setReceivedRow] = useState<ScheduleItem | null>(null);

  async function fetchLoan() {
    try {
      const res = await fetch(`/api/loans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLoan(data.loan);
        setSchedule(data.schedule || []);
      } else setLoan(null);
    } catch {
      setLoan(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLoan();
  }, [id]);

  const getStatus = (item: ScheduleItem) => {
    if (item.status === "paid") return "paid";
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return "missed";
    return "upcoming";
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!loan) return <div className="text-red-500">Loan not found.</div>;

  const unpaidSchedule = schedule.filter((s) => getStatus(s) !== "paid");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Loan – {typeof loan.clientId === "object" ? loan.clientId.name : "—"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 capitalize">{loan.loanType} • {formatCurrency(loan.principal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Principal</p>
          <p className="text-xl font-semibold text-slate-800 dark:text-white">{formatCurrency(loan.principal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Payable</p>
          <p className="text-xl font-semibold text-slate-800 dark:text-white">{formatCurrency(loan.totalPayable)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Period</p>
          <p className="text-slate-800 dark:text-white">{formatDate(loan.startDate)} – {formatDate(loan.endDate)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Installment</p>
          <p className="text-slate-800 dark:text-white">
            {loan.dailyAmount != null && `${formatCurrency(loan.dailyAmount)}/day`}
            {loan.weeklyAmount != null && `${formatCurrency(loan.weeklyAmount)}/week`}
            {loan.monthlyAmount != null && `${formatCurrency(loan.monthlyAmount)}/month`}
            {!loan.dailyAmount && !loan.weeklyAmount && !loan.monthlyAmount && "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Payment Schedule</h2>
        {unpaidSchedule.length > 0 && (
          <button onClick={() => setShowPaymentModal(true)} className="btn-secondary text-sm">
            Record multiple
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Due Date</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {schedule.map((item) => {
                const status = getStatus(item);
                const effectiveAmount = (item.amount || 0) + (item.carryForwardAmount || 0);
                return (
                  <tr
                    key={item._id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                      status === "missed" ? "bg-red-50 dark:bg-red-900/20" : ""
                    }`}
                  >
                    <td className="px-6 py-3 text-slate-800 dark:text-slate-200">{formatDate(item.dueDate)}</td>
                    <td className="px-6 py-3">
                      {formatCurrency(effectiveAmount)}
                      {(item.carryForwardAmount || 0) > 0 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">(incl. carry)</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {status === "paid" && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-4 h-4" /> Paid
                        </span>
                      )}
                      {status === "upcoming" && (
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4" /> Upcoming
                        </span>
                      )}
                      {status === "missed" && (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="w-4 h-4" /> Missed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {status === "paid" ? (
                        <span className="text-slate-400 text-sm">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReceivedRow(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#001C3D] hover:bg-[#002347] text-white text-sm font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Received
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {receivedRow && (
        <ReceivedModal
          scheduleItem={receivedRow}
          onClose={() => setReceivedRow(null)}
          onSuccess={() => {
            setReceivedRow(null);
            fetchLoan();
          }}
        />
      )}
      {showPaymentModal && (
        <RecordPaymentModal
          loanId={id}
          scheduleItems={unpaidSchedule}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchLoan();
          }}
        />
      )}
    </div>
  );
}

function ReceivedModal({
  scheduleItem,
  onClose,
  onSuccess,
}: {
  scheduleItem: ScheduleItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const effectiveDue = (scheduleItem.amount || 0) + (scheduleItem.carryForwardAmount || 0);
  const [amount, setAmount] = useState(String(effectiveDue));
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [method, setMethod] = useState<"cash" | "upi">("cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankName, setBankName] = useState("");
  const [banks, setBanks] = useState<{ _id: string; bankName: string; upiId: string }[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/bank-accounts").then((r) => r.json()).then((d) => setBanks(d.accounts || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Enter valid amount");
      return;
    }
    if (method === "upi" && !bankAccountId) {
      setError("Select bank for UPI");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        scheduleId: scheduleItem._id,
        amount: amt,
        paidAt: new Date(paidAt).toISOString(),
        method,
      };
      if (method === "upi") {
        body.bankAccountId = bankAccountId;
        body.bankName = bankName || banks.find((b) => b._id === bankAccountId)?.bankName;
      }
      const res = await fetch("/api/payments/record-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card w-full max-w-md">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Received</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 text-sm">{error}</div>}
          <p className="text-sm text-slate-500">Due date: {formatDate(scheduleItem.dueDate)}</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" required />
            <p className="text-xs text-slate-500 mt-0.5">Due: {formatCurrency(effectiveDue)}. Pay less → remainder added to next.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date & Time *</label>
            <input type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Method *</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "upi")} className="input-field">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          {method === "upi" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank *</label>
              <select
                value={bankAccountId}
                onChange={(e) => { const id = e.target.value; setBankAccountId(id); setBankName(banks.find((b) => b._id === id)?.bankName || ""); }}
                className="input-field"
              >
                <option value="">Select</option>
                {banks.map((b) => <option key={b._id} value={b._id}>{b.bankName}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 bg-[#001C3D] hover:bg-[#002347]">
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecordPaymentModal({
  loanId,
  scheduleItems,
  onClose,
  onSuccess,
}: {
  loanId: string;
  scheduleItems: ScheduleItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [method, setMethod] = useState<"cash" | "upi">("cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankName, setBankName] = useState("");
  const [transactionTime, setTransactionTime] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [banks, setBanks] = useState<{ _id: string; bankName: string; upiId: string }[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((d) => setBanks(d.accounts || []));
  }, []);

  const toggleSchedule = (sid: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const totalSelected = scheduleItems
    .filter((s) => selectedScheduleIds.includes(s._id))
    .reduce((sum, s) => sum + s.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (selectedScheduleIds.length === 0) {
      setError("Select at least one schedule row to pay");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (method === "upi" && !bankAccountId) {
      setError("Select a bank account for UPI");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        loanId,
        scheduleIds: selectedScheduleIds,
        amount: amt,
        paidAt: new Date(paidAt).toISOString(),
        method,
      };
      if (method === "upi") {
        body.bankAccountId = bankAccountId;
        body.bankName = bankName || banks.find((b) => b._id === bankAccountId)?.bankName;
        if (transactionTime) body.transactionTime = new Date(transactionTime).toISOString();
        if (referenceNote) body.referenceNote = referenceNote;
      }
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record payment");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Record Payment</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select installments to mark as paid</label>
            <div className="max-h-32 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              {scheduleItems.map((s) => (
                <label key={s._id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedScheduleIds.includes(s._id)}
                    onChange={() => toggleSchedule(s._id)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{formatDate(s.dueDate)} – {formatCurrency(s.amount)}</span>
                </label>
              ))}
            </div>
            {selectedScheduleIds.length > 0 && (
              <p className="text-sm text-slate-500 mt-1">Selected total: {formatCurrency(totalSelected)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Paid (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method *</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "upi")} className="input-field">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          {method === "upi" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Account *</label>
                <select
                  value={bankAccountId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setBankAccountId(id);
                    setBankName(banks.find((b) => b._id === id)?.bankName || "");
                  }}
                  className="input-field"
                >
                  <option value="">Select bank</option>
                  {banks.map((b) => (
                    <option key={b._id} value={b._id}>{b.bankName} – {b.upiId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Transaction Time</label>
                <input
                  type="datetime-local"
                  value={transactionTime}
                  onChange={(e) => setTransactionTime(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reference Note</label>
                <input
                  type="text"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  className="input-field"
                  placeholder="UPI ref / note"
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
