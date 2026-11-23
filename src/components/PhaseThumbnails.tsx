import React from 'react';

interface IconProps {
  className?: string;
}

export const StarIllustration: React.FC<IconProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
    <circle cx="80" cy="82" r="58" fill="#FDE68A" opacity="0.65" />
    <path
      d="M80 18 L97 56 L138 61 L107 89 L115 130 L80 110 L45 130 L53 89 L22 61 L63 56 Z"
      fill="#FBBF24"
      stroke="#D97706"
      strokeWidth="8"
      strokeLinejoin="round"
    />
    <path
      d="M80 34 L90 58 L116 61 L96 79 L101 104 L80 91"
      fill="none"
      stroke="#FEF3C7"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.75"
    />
  </svg>
);

export const MazeIllustration: React.FC<IconProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
    <rect
      x="14"
      y="14"
      width="132"
      height="132"
      rx="22"
      fill="#CBD5E1"
      stroke="#94A3B8"
      strokeWidth="6"
    />
    <rect x="24" y="24" width="35" height="35" rx="8" fill="#60A5FA" />
    <rect x="24" y="62.5" width="35" height="35" rx="8" fill="#60A5FA" />
    <rect x="62.5" y="62.5" width="35" height="35" rx="8" fill="#60A5FA" />
    <rect x="62.5" y="101" width="35" height="35" rx="8" fill="#60A5FA" />
    <rect
      x="101"
      y="101"
      width="35"
      height="35"
      rx="8"
      fill="#34D399"
      stroke="#059669"
      strokeWidth="4"
    />
    <rect x="62.5" y="24" width="35" height="35" rx="8" fill="#94A3B8" opacity="0.6" />
    <rect x="101" y="24" width="35" height="35" rx="8" fill="#94A3B8" opacity="0.6" />
    <rect x="101" y="62.5" width="35" height="35" rx="8" fill="#94A3B8" opacity="0.6" />
    <rect x="24" y="101" width="35" height="35" rx="8" fill="#94A3B8" opacity="0.6" />

    <path
      d="M41.5 41.5 L41.5 80 L80 80 L80 118.5 L118.5 118.5"
      fill="none"
      stroke="#EFF6FF"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="6 6"
    />
    <circle cx="41.5" cy="41.5" r="14" fill="#F97316" stroke="#FFFFFF" strokeWidth="4" />
    <path
      d="M113 128 L113 109 L126 115 L113 120"
      fill="#ECFDF5"
      stroke="#065F46"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GridHouseIllustration: React.FC<IconProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
    <rect
      x="14"
      y="14"
      width="132"
      height="132"
      rx="22"
      fill="#FFFFFF"
      stroke="#86EFAC"
      strokeWidth="6"
    />
    {[32, 56, 80, 104, 128].map((pos) => (
      <g key={pos}>
        <line x1="32" y1={pos} x2="128" y2={pos} stroke="#E2E8F0" strokeWidth="3" />
        <line x1={pos} y1="32" x2={pos} y2="128" stroke="#E2E8F0" strokeWidth="3" />
      </g>
    ))}
    <polygon
      points="32,80 80,32 128,80"
      fill="#BFDBFE"
      fillOpacity="0.5"
      stroke="#2563EB"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="56,80 56,128 104,128 104,80"
      fill="#DBEAFE"
      fillOpacity="0.5"
      stroke="#2563EB"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {[
      [80, 32],
      [32, 80],
      [56, 80],
      [104, 80],
      [128, 80],
      [56, 128],
      [104, 128],
    ].map(([cx, cy], idx) => (
      <circle
        key={idx}
        cx={cx}
        cy={cy}
        r="5.5"
        fill="#FFFFFF"
        stroke="#1D4ED8"
        strokeWidth="3"
      />
    ))}
  </svg>
);
