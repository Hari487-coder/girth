import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ListIcon, XIcon } from '@phosphor-icons/react'
import type { UserRole } from '@girth/domain'
import { useSession } from '../lib/session'

const ENV = (import.meta.env.VITE_APP_ENV as string | undefined) ?? 'local'

interface NavItem {
  to: string
  label: string
  roles?: UserRole[]
}

const ITEMS: NavItem[] = [
  { to: '/trees', label: 'Find a Tree' },
  { to: '/my-trees', label: 'My Trees', roles: ['CUSTOMER'] },
  { to: '/farm', label: 'My Farm', roles: ['FARMER'] },
  { to: '/review', label: 'Review', roles: ['FIELD_AUDITOR', 'ADMIN'] },
  { to: '/audits', label: 'Audits', roles: ['FIELD_AUDITOR', 'ADMIN'] },
  { to: '/org', label: 'Programs', roles: ['ORGANISATION', 'ADMIN'] },
  { to: '/admin', label: 'Admin', roles: ['ADMIN'] },
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
  const { user, logout } = useSession()
  const navigate = useNavigate()
  const items = ITEMS.filter((i) => !i.roles || (user && i.roles.includes(user.role)))

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors ${isActive ? 'bg-canopy-soft text-canopy-deep' : 'text-ink-soft hover:text-ink'}`

  async function signOut() {
    setOpen(false)
    // leave any protected page first so its redirect doesn't remember it as "from"
    navigate('/')
    await logout()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {ENV !== 'production' && (
            <span className="demo-chip" title="This is not the production environment">
              {ENV}
            </span>
          )}
          {user ? (
            <div className="hidden items-center gap-3 lg:flex">
              <span className="text-[13px] text-ink-soft">{user.name}</span>
              <button type="button" onClick={signOut} className="btn-secondary btn-small">
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary btn-small hidden lg:inline-flex">
              Sign in
            </Link>
          )}
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
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `block rounded-xl px-3 py-2.5 text-[15px] font-medium ${isActive ? 'bg-canopy-soft text-canopy-deep' : 'text-ink-soft'}`}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="mt-3 border-t border-line px-3 pt-3">
            {user ? (
              <button type="button" onClick={signOut} className="btn-secondary btn-small">
                Sign out ({user.name})
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="btn-primary btn-small">
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
