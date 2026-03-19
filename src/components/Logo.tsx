"use client";

import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  noLink?: boolean;
}

const sizes = { sm: { w: 36, h: 36 }, md: { w: 48, h: 48 }, lg: { w: 64, h: 64 } };

export default function Logo({ className = "", size = "md", showText = true, noLink }: LogoProps) {
  const { w, h } = sizes[size];
  const content = (
    <>
      <svg
        width={w}
        height={h}
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Shield border - gold gradient */}
        <defs>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <linearGradient id="navyGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#002347" />
            <stop offset="50%" stopColor="#001C3D" />
            <stop offset="100%" stopColor="#001C3D" />
          </linearGradient>
        </defs>
        {/* Shield path */}
        <path
          d="M60 8 L108 28 L108 72 C108 100 60 128 60 128 C60 128 12 100 12 72 L12 28 Z"
          stroke="url(#gold)"
          strokeWidth="4"
          fill="url(#navyGlow)"
        />
        {/* Star */}
        <path
          d="M60 38 L62.5 46 L71 46 L64 51 L66 60 L60 55 L54 60 L56 51 L49 46 L57.5 46 Z"
          fill="url(#gold)"
        />
        {/* Bar chart - 4 bars */}
        <rect x="42" y="68" width="8" height="12" rx="2" fill="url(#gold)" opacity="0.9" />
        <rect x="54" y="62" width="8" height="18" rx="2" fill="url(#gold)" opacity="0.9" />
        <rect x="66" y="56" width="8" height="24" rx="2" fill="url(#gold)" opacity="0.9" />
        <rect x="78" y="50" width="8" height="30" rx="2" fill="url(#gold)" opacity="0.9" />
        {/* Arrow */}
        <path
          d="M38 95 Q55 82 72 78 L78 72 L84 82 L78 88 Q62 92 45 98 Z"
          fill="url(#gold)"
          opacity="0.95"
        />
      </svg>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-[#001C3D] dark:text-[#E2E8F0] text-lg tracking-tight">DAHIYA</span>
          <span className="text-[10px] sm:text-xs font-medium text-[#B8860B] tracking-widest">FINANCE CO.</span>
        </div>
      )}
    </>
  );
  if (noLink) return <div className={`inline-flex items-center gap-3 ${className}`}>{content}</div>;
  return <Link href="/dashboard" className={`inline-flex items-center gap-3 ${className}`}>{content}</Link>;
}
