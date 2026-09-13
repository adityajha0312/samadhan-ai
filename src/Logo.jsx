function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <polygon points="12,2 22,8 2,8" fill="url(#logoGrad)" />
      <rect x="3" y="9" width="2.2" height="10" fill="url(#logoGrad)" />
      <rect x="7.4" y="9" width="2.2" height="10" fill="url(#logoGrad)" />
      <rect x="10.9" y="9" width="2.2" height="10" fill="url(#logoGrad)" />
      <rect x="14.4" y="9" width="2.2" height="10" fill="url(#logoGrad)" />
      <rect x="18.8" y="9" width="2.2" height="10" fill="url(#logoGrad)" />
      <rect x="2" y="19.5" width="20" height="2" rx="0.5" fill="url(#logoGrad)" />
    </svg>
  )
}

export default Logo