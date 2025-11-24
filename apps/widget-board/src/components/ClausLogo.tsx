import React from 'react';

export const ClausLogo = ({ className = "w-8 h-8", size = 24 }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="clausGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky Blue */}
                <stop offset="100%" stopColor="#6366f1" /> {/* Indigo */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Outer Hexagon/Shield shape for protection/structure */}
        <path
            d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
            stroke="url(#clausGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="rgba(14, 165, 233, 0.1)"
        />

        {/* Stylized 'C' / 'W' abstract shape */}
        <path
            d="M26 14H16C14.8954 14 14 14.8954 14 16V24C14 25.1046 14.8954 26 16 26H24"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
        />

        {/* Digital dot/node */}
        <circle cx="26" cy="26" r="2.5" fill="#0ea5e9" />
    </svg>
);
