import { useId } from "react";

import "./Logo.css";

function LogoMark({ size = 36 }) {
  const gradientId = useId();

  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="logo-gradient-start" offset="0" />
          <stop className="logo-gradient-end" offset="1" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />

      <path
        className="logo-mark-shine"
        d="M11 0h18a11 11 0 0 1 11 11v4C27 9 13 9 0 15v-4A11 11 0 0 1 11 0Z"
      />

      <path
        className="logo-mark-check"
        d="M11.5 20.5l6 6 11-12.5"
      />

      <circle className="logo-mark-dot" cx="30.5" cy="9.5" r="3.5" />
    </svg>
  );
}

function Logo({ size = 36, showWordmark = true }) {
  return (
    <div className="logo" role="img" aria-label="Task Master">
      <LogoMark size={size} />

      {showWordmark && (
        <span className="logo-wordmark" aria-hidden="true">
          Task<span className="logo-wordmark-accent">Master</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
