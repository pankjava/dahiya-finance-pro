"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Wallet } from "lucide-react";

export default function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ clients: { _id: string; name: string; mobile?: string }[]; loans: { _id: string; clientId?: { name: string }; loanType?: string }[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) setResults(await res.json());
        else setResults(null);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && (results.clients.length > 0 || results.loans.length > 0);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="search"
          placeholder="Search client by name or mobile..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="input-field pl-10 pr-4 w-full"
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 card overflow-hidden shadow-xl animate-slide-up">
          {loading ? (
            <div className="p-4 text-slate-500 text-sm">Searching...</div>
          ) : hasResults ? (
            <div className="max-h-72 overflow-y-auto">
              {results!.clients.length > 0 && (
                <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Clients</p>
                  {results!.clients.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => { router.push(`/dashboard/clients/${c._id}`); setOpen(false); setQ(""); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <User className="w-4 h-4 text-[#001C3D] dark:text-amber-400" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="text-slate-500 text-sm">{c.mobile}</span>
                    </button>
                  ))}
                </div>
              )}
              {results!.loans.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Loans</p>
                  {results!.loans.map((l) => (
                    <button
                      key={l._id}
                      type="button"
                      onClick={() => { router.push(`/dashboard/loans/${l._id}`); setOpen(false); setQ(""); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <Wallet className="w-4 h-4 text-[#B8860B]" />
                      <span className="text-slate-800 dark:text-slate-200">
                        {l.clientId && typeof l.clientId === "object" ? l.clientId.name : "—"} • {l.loanType || ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-slate-500 text-sm">No clients or loans found.</div>
          )}
        </div>
      )}
    </div>
  );
}
