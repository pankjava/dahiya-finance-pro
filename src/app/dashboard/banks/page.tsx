"use client";

import { useEffect, useState } from "react";
import { Plus, Building2, QrCode } from "lucide-react";

interface BankAccount {
  _id: string;
  bankName: string;
  upiId: string;
  qrCodeUrl?: string;
}

export default function BanksPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function fetchBanks() {
    setLoading(true);
    try {
      const res = await fetch("/api/bank-accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBanks();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bank Accounts</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Bank Account
        </button>
      </div>

      {showForm && (
        <AddBankForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchBanks();
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-500">Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full card p-8 text-center text-slate-500">No bank accounts. Add one for UPI payments.</div>
        ) : (
          accounts.map((acc) => (
            <div key={acc._id} className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{acc.bankName}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 break-all">{acc.upiId}</p>
                  {acc.qrCodeUrl && (
                    <div className="mt-3">
                      <img src={acc.qrCodeUrl} alt="QR" className="w-20 h-20 object-contain rounded border border-slate-200 dark:border-slate-700" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AddBankForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, upiId, qrCodeUrl: qrCodeUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add");
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
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Add Bank Account</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Name *</label>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UPI ID *</label>
            <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="input-field" placeholder="name@bank" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">QR Code (URL)</label>
            <input type="url" value={qrCodeUrl} onChange={(e) => setQrCodeUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? "Adding…" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
