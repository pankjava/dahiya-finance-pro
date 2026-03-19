"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { Plus, Search, MapPin, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Client {
  _id: string;
  name: string;
  address: string;
  mobile: string;
  alternateMobile?: string;
  mapLink?: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: string;
  totalLoansTaken: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function fetchClients() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchClients(), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clients</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {showForm && (
        <AddClientForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchClients();
          }}
        />
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No clients yet. Add your first client.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Date Added</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Total Loans</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/clients/${c._id}`} className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4">{c.totalLoansTaken}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <a href={`tel:${c.mobile}`} className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-600">
                          <Phone className="w-4 h-4" />
                          {c.mobile}
                        </a>
                        {c.alternateMobile && (
                          <span className="text-sm text-slate-500">Alt: {c.alternateMobile}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(c.mapLink || c.location) ? (
                        <a
                          href={c.mapLink || `https://www.google.com/maps?q=${c.location!.lat},${c.location!.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          <MapPin className="w-4 h-4" />
                          View map
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
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

function AddClientForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [relativeMobile, setRelativeMobile] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [aadharUrl, setAadharUrl] = useState("");
  const [panUrl, setPanUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleFileChange(type: "aadhar" | "pan" | "photo", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("type", type);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (type === "aadhar") setAadharUrl(data.url);
      else if (type === "pan") setPanUrl(data.url);
      else setPhotoUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          mobile,
          alternateMobile: alternateMobile || undefined,
          relativeMobile: relativeMobile || undefined,
          mapLink: mapLink.trim() || undefined,
          aadharUrl: aadharUrl || undefined,
          panUrl: panUrl || undefined,
          photoUrl: photoUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add client");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function FileUpload({ type, label, value }: { type: "aadhar" | "pan" | "photo"; label: string; value: string }) {
    const isImage = value && /\.(jpg|jpeg|png|webp)$/i.test(value);
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileChange(type, e)}
            className="hidden"
            id={`file-${type}`}
          />
          <label htmlFor={`file-${type}`} className="btn-secondary cursor-pointer text-sm py-2">
            {uploading === type ? "Uploading…" : "Choose file"}
          </label>
          {value && (
            <div className="flex items-center gap-2">
              {isImage ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <img src={value} alt="" className="h-14 w-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                </a>
              ) : (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-[#001C3D] dark:text-amber-400 hover:underline">View PDF</a>
              )}
              <button type="button" onClick={() => { if (type === "aadhar") setAadharUrl(""); else if (type === "pan") setPanUrl(""); else setPhotoUrl(""); }} className="text-red-500 text-xs">Remove</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="card w-full max-w-lg max-h-[95vh] overflow-y-auto my-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Add Client</h2>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address *</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input-field min-h-[80px]" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile *</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alternate Mobile</label>
            <input type="tel" value={alternateMobile} onChange={(e) => setAlternateMobile(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relative Mobile</label>
            <input type="tel" value={relativeMobile} onChange={(e) => setRelativeMobile(e.target.value)} className="input-field" placeholder="Relative / family contact" />
          </div>
          <FileUpload type="aadhar" label="Aadhar Card (upload)" value={aadharUrl} />
          <FileUpload type="pan" label="PAN Card (upload)" value={panUrl} />
          <FileUpload type="photo" label="Client Photo (upload)" value={photoUrl} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Google Map link (optional)</label>
            <input type="url" value={mapLink} onChange={(e) => setMapLink(e.target.value)} className="input-field" placeholder="https://maps.google.com/..." />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 bg-[#001C3D] hover:bg-[#002347] focus:ring-[#B8860B]">
              {submitting ? "Adding…" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
