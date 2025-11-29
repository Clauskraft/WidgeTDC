import React from 'react';

interface DotLogoProps {
    size?: number;
    className?: string;
}

export const DotLogo: React.FC<DotLogoProps> = ({ size = 32, className = '' }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Glow/Ring */}
            <circle cx="16" cy="16" r="15" stroke="url(#dotGradient)" strokeWidth="1.5" strokeOpacity="0.3" />
            
            {/* Inner Orbital Ring */}
            <path 
                d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28" 
                stroke="url(#dotGradient)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                className="animate-[spin_3s_linear_infinite]"
                style={{ transformOrigin: 'center' }}
            />
            
            {/* Core DOT */}
            <circle cx="16" cy="16" r="6" fill="url(#dotCoreGradient)">
                <animate 
                    attributeName="r" 
                    values="6;7;6" 
                    dur="2s" 
                    repeatCount="indefinite" 
                />
                <animate 
                    attributeName="opacity" 
                    values="1;0.8;1" 
                    dur="2s" 
                    repeatCount="indefinite" 
                />
            </circle>

            {/* Definitions */}
            <defs>
                <linearGradient id="dotGradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00B5CB" />
                    <stop offset="1" stopColor="#00677F" />
                </linearGradient>
                <linearGradient id="dotCoreGradient" x1="10" y1="10" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00B5CB" />
                    <stop offset="1" stopColor="#ffffff" />
                </linearGradient>
            </defs>
        </svg>
    );
};

