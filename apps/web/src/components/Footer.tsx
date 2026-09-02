import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-bold text-ink">Girth</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              Measured. Documented. Verified. Every tree on Girth has a permanent ID, a yearly girth reading with photo
              and location, and a history that cannot be quietly edited.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">Sponsor</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <Link to="/trees" className="hover:text-canopy">Find a Tree</Link>
              </li>
              <li>
                <Link to="/my-trees" className="hover:text-canopy">My Trees</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">Work with Girth</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <Link to="/farm" className="hover:text-canopy">Farmer portal</Link>
              </li>
              <li>
                <Link to="/org" className="hover:text-canopy">Organisation programs</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-canopy">Sign in</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <p className="text-sm text-ink-muted">A tree is planted once. Its story shouldn't end there.</p>
        </div>
      </div>
    </footer>
  )
}
