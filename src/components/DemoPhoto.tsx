interface DemoPhotoProps {
  girthCm: number
  className?: string
}

/**
 * A clearly-labelled stand-in for the farmer's measurement photograph: a
 * stylised trunk with the tape wrapped at standard measurement height.
 * The prototype never pretends this is a real photo.
 */
export function DemoPhoto({ girthCm, className }: DemoPhotoProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-line ${className ?? ''}`}>
      <svg viewBox="0 0 400 280" width="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Demo verification photo: a measuring tape wrapped around a tree trunk">
        {/* field backdrop */}
        <rect width="400" height="280" fill="#e8ecdf" />
        <rect y="196" width="400" height="84" fill="#cfd8bd" />
        <ellipse cx="80" cy="70" rx="90" ry="48" fill="#c4d2b4" opacity="0.7" />
        <ellipse cx="330" cy="52" rx="110" ry="56" fill="#b7c8a6" opacity="0.6" />
        <ellipse cx="200" cy="30" rx="140" ry="50" fill="#a9bd95" opacity="0.5" />

        {/* trunk */}
        <path
          d="M 168 280 C 172 200 170 120 164 52 L 236 52 C 230 120 228 200 232 280 Z"
          fill="#8a7156"
        />
        <path
          d="M 168 280 C 172 200 170 120 164 52 L 186 52 C 182 120 182 200 184 280 Z"
          fill="#6b5744"
          opacity="0.45"
        />
        {[182, 196, 210, 224].map((x) => (
          <path
            key={x}
            d={`M ${x} 60 C ${x + 3} 120 ${x - 2} 190 ${x + 2} 275`}
            stroke="#5a4636"
            strokeWidth="1.4"
            fill="none"
            opacity="0.5"
          />
        ))}

        {/* measurement height reference */}
        <line x1="30" y1="150" x2="150" y2="150" stroke="var(--color-ink-muted)" strokeWidth="1" strokeDasharray="4 4" />
        <text x="30" y="140" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-ink-soft)">
          standard height
        </text>

        {/* tape around the trunk */}
        <path
          d="M 130 148 L 270 142 L 271 168 L 131 174 Z"
          fill="var(--color-tape)"
        />
        <path d="M 130 148 L 270 142 L 270.5 147 L 130.5 153 Z" fill="#ffffff" opacity="0.4" />
        {Array.from({ length: 14 }, (_, i) => 136 + i * 10).map((x, i) => (
          <line
            key={x}
            x1={x}
            y1={148 - (x - 130) * 0.043 + 2}
            x2={x}
            y2={148 - (x - 130) * 0.043 + (i % 5 === 0 ? 12 : 7)}
            stroke="var(--color-tape-ink)"
            strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
            opacity="0.7"
          />
        ))}
        <text x="243" y="164" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700" fill="var(--color-tape-ink)">
          {girthCm}
        </text>
        {/* tape tail hanging */}
        <path d="M 270 142 L 300 150 L 298 176 L 271 168 Z" fill="var(--color-tape-deep)" opacity="0.9" />
      </svg>

      <span className="absolute top-2 left-2 rounded-md bg-ink/80 px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-white uppercase">
        Demo verification photo
      </span>
    </div>
  )
}
