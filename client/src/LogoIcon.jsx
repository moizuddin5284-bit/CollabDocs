export default function LogoIcon({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logo-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="logo-page-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <linearGradient id="logo-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <filter id="logo-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Background Squircle */}
      <rect width="40" height="40" rx="10" fill="url(#logo-bg-grad)" />

      {/* Back Layer Sheet */}
      <rect x="9" y="8" width="18" height="23" rx="3" fill="#a5b4fc" opacity="0.45" />

      {/* Front Main Document Sheet */}
      <g filter="url(#logo-shadow)">
        <path
          d="M13 11C13 9.89543 13.8954 9 15 9H23.5L29 14.5V28C29 29.1046 28.1046 30 27 30H15C13.8954 30 13 29.1046 13 28V11Z"
          fill="url(#logo-page-grad)"
        />
        {/* Document Folded Corner */}
        <path
          d="M23.5 9V13.5C23.5 14.0523 23.9477 14.5 24.5 14.5H29L23.5 9Z"
          fill="#c7d2fe"
        />
      </g>

      {/* Document Text Line Indicators */}
      <rect x="16.5" y="16.5" width="6" height="2" rx="1" fill="#4f46e5" />
      <rect x="16.5" y="20.5" width="9" height="2" rx="1" fill="#6366f1" opacity="0.8" />
      <rect x="16.5" y="24.5" width="7" height="2" rx="1" fill="#6366f1" opacity="0.8" />

      {/* Live Collaboration Sparkle Indicator */}
      <circle cx="28.5" cy="27.5" r="4.5" fill="url(#logo-accent-grad)" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M28.5 25.5L29.1 26.9L30.5 27.5L29.1 28.1L28.5 29.5L27.9 28.1L26.5 27.5L27.9 26.9L28.5 25.5Z" fill="#ffffff" />
    </svg>
  );
}
