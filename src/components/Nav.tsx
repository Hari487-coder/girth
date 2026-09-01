import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ListIcon, XIcon } from '@phosphor-icons/react'
import { useStore } from '../lib/store'

const LINKS = [
  { to: '/trees', label: 'Find a Tree' },
  { to: '/my-trees', label: 'My Trees' },
  { to: '/farmer', label: 'Farmer Portal' },
  { to: '/verification', label: 'Verification' },
  { to: '/experiments', label: 'Experiments' },
]

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Girth home">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--color-canopy)" />
        <circle cx="16" cy="16" r="9.5" fill="none" stroke="var(--color-paper)" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="6" fill="none" stroke="var(--color-paper)" strokeWidth="1.2" opacity="0.8" />
        <circle cx="16" cy="16" r="2.8" fill="none" stroke="var(--color-paper)" strokeWidth="1" opacity="0.6" />
        <rect x="4" y="14.4" width="24" height="3.2" fill="var(--color-tape)" />
        <line x1="16" y1="13.6" x2="16" y2="18.4" stroke="var(--color-alert)" strokeWidth="1.4" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-ink">Girth</span>
    </Link>
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const { state } = useStore()
  const myTreesCount = state.sponsorships.length

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors ${
      isActive ? 'bg-canopy-soft text-canopy-deep' : 'text-ink-soft hover:text-ink'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
              {link.to === '/my-trees' && myTreesCount > 0 && (
                <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-canopy font-mono text-[11px] font-semibold text-white">
                  {myTreesCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="demo-chip" title="All data in this prototype is fictional">
            <span className="size-1.5 rounded-full bg-tape-deep" aria-hidden="true" />
            Demo mode
          </span>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink lg:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <XIcon size={22} /> : <ListIcon size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-paper px-4 pt-2 pb-4 lg:hidden" aria-label="Main mobile">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-[15px] font-medium ${
                  isActive ? 'bg-canopy-soft text-canopy-deep' : 'text-ink-soft'
                }`
              }
            >
              {link.label}
              {link.to === '/my-trees' && myTreesCount > 0 && (
                <span className="ml-2 font-mono text-[12px] text-canopy-deep">({myTreesCount})</span>
              )}
            </NavLink>
          ))}
          <p className="mt-3 px-3 font-mono text-[11px] text-ink-muted">
            Demo mode: all data is fictional.
          </p>
        </nav>
      )}
    </header>
  )
}
