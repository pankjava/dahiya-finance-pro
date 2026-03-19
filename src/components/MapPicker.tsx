"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  lat?: number;
  lng?: number;
  address?: string;
  onChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapPicker({ lat, lng, address, onChange, className = "" }: MapPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState(lat?.toString() ?? "");
  const [manualLng, setManualLng] = useState(lng?.toString() ?? "");

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !ref.current) return;
    setLoading(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const map = new (window as unknown as { google: { maps: { Map: new (el: HTMLElement, o: object) => object; LatLng: new (a: number, b: number) => object; Marker: new (o: object) => object; event: { addListener: (a: object, b: string, fn: () => void) => void } } }).google.maps.Map(ref.current!, {
        center: { lat: lat ?? 28.6139, lng: lng ?? 77.209 },
        zoom: 14,
      });
      const marker = new (window as unknown as { google: { maps: { Marker: new (o: object) => { setPosition: (p: object) => void; getPosition: () => { lat: () => number; lng: () => number } } } }).google.maps.Marker({
        position: { lat: lat ?? 28.6139, lng: lng ?? 77.209 },
        map,
        draggable: true,
      });
      (window as unknown as { google: { maps: { event: { addListener: (a: object, b: string, fn: () => void) => void } } }).google.maps.event.addListener(map, "click", (e: { latLng: { lat: () => number; lng: () => number } }) => {
        marker.setPosition(e.latLng);
        onChange(e.latLng.lat(), e.latLng.lng());
      });
      (window as unknown as { google: { maps: { event: { addListener: (a: object, b: string, fn: () => void) => void } } }).google.maps.event.addListener(marker, "dragend", () => {
        const pos = marker.getPosition();
        if (pos) onChange(pos.lat(), pos.lng());
      });
      setLoading(false);
    };
    script.onerror = () => {
      setError("Failed to load map");
      setLoading(false);
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [GOOGLE_MAPS_KEY]);

  const applyManual = () => {
    const la = parseFloat(manualLat);
    const ln = parseFloat(manualLng);
    if (!Number.isNaN(la) && !Number.isNaN(ln)) onChange(la, ln);
  };

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={className}>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map.</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="input-field"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            className="input-field"
          />
        </div>
        <button type="button" onClick={applyManual} className="btn-secondary mt-2 text-sm">
          Set location
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={ref} className="w-full h-48 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700" />
      {loading && <p className="text-xs text-slate-500 mt-1">Loading map…</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-slate-500 mt-1">Click map or drag pin to set location.</p>
    </div>
  );
}
