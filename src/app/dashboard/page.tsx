"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#001C3D", "#B8860B", "#8b5cf6", "#0ea5e9"];
const MODE_COLORS = ["#001C3D", "#B8860B"];

export default function DashboardPage() {
  const [data, setData] = useState<{
    totalPaymentsReceived: number;
    pendingPayments: number;
    pendingCount: number;
    latePaymentsAmount: number;
    latePaymentsCount: number;
    todayCollection: number;
    byLoanType: Record<string, number>;
    byPaymentMode: Record<string, number>;
    dailyTrend: { date: string; label: string; total: number }[];
  } | null>(null);
  type Range = "today" | "yesterday" | "last7" | "lastMonth" | "tillDate";
  const [range, setRange] = useState<Range>("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard?range=${range}`);
        if (res.ok) setData(await res.json());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-500">Loading dashboard…</div>
      </div>
    );
  }

  const loanTypeData = Object.entries(data.byLoanType).map(([name, total]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: total,
  }));
  const modeData = Object.entries(data.byPaymentMode).map(([name, total]) => ({
    name: name === "upi" ? "UPI" : "Cash",
    value: total,
  }));

  const rangeButtons: { value: Range; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7", label: "Last 7 Days" },
    { value: "lastMonth", label: "Last Month" },
    { value: "tillDate", label: "Till Date" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {rangeButtons.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                range === r.value
                  ? "bg-[#001C3D] text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 border-l-4 border-[#001C3D] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Received</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(data.totalPaymentsReceived)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#001C3D]/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#001C3D] dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(data.pendingPayments)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{data.pendingCount} installments</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Late / Missed</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(data.latePaymentsAmount)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{data.latePaymentsCount} missed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-[#B8860B] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Collection ({range === "today" ? "Today" : range === "yesterday" ? "Yesterday" : range === "last7" ? "7 Days" : range === "lastMonth" ? "Month" : "All"})</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(data.todayCollection)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#B8860B]/20 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-[#B8860B]" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Collection trend (last 7 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), "Collection"]} />
                <Bar dataKey="total" fill="#001C3D" radius={[4, 4, 0, 0]} name="Collection" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">By loan type</h2>
          <div className="h-64">
            {loanTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {loanTypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 flex items-center justify-center h-full">No data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 max-w-md">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Payment mode</h2>
        {modeData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {modeData.map((_, i) => (
                    <Cell key={i} fill={MODE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500">No payments yet</p>
        )}
      </div>
    </div>
  );
}
