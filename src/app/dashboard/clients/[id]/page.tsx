"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Phone, Wallet } from "lucide-react";

interface Client {
  _id: string;
  name: string;
  address: string;
  mobile: string;
  alternateMobile?: string;
  mapLink?: string;
  location?: { lat: number; lng: number };
  createdAt: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (res.ok) setClient((await res.json()).client);
        else setClient(null);
      } catch {
        setClient(null);
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [id]);

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!client) return <div className="text-red-500">Client not found.</div>;

  const mapUrl = client.mapLink || (client.location ? `https://www.google.com/maps?q=${client.location.lat},${client.location.lng}` : null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Address</dt>
              <dd className="text-slate-800 dark:text-slate-200">{client.address}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Mobile</dt>
              <dd>
                <a href={`tel:${client.mobile}`} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                  <Phone className="w-4 h-4" />
                  {client.mobile}
                </a>
              </dd>
            </div>
            {client.alternateMobile && (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Alternate Mobile</dt>
                <dd>{client.alternateMobile}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Added on</dt>
              <dd>{formatDate(client.createdAt)}</dd>
            </div>
            {mapUrl && (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Location</dt>
                <dd>
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline">
                    <MapPin className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Loans</h2>
        <Link href={`/dashboard/loans/new?clientId=${id}`} className="btn-primary">
          <Wallet className="w-5 h-5" />
          New Loan
        </Link>
      </div>
      <div className="card p-6">
        <Link href={`/dashboard/loans?clientId=${id}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
          View all loans for this client →
        </Link>
      </div>
    </div>
  );
}
