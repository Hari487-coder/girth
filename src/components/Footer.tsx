import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'

export function Footer() {
  const { dispatch } = useStore()

  function resetDemo() {
    if (window.confirm('Reset the demo? Sponsorships, submissions and simulated growth will be cleared.')) {
      dispatch({ type: 'RESET' })
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-bold text-ink">Girth</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              A Lean Startup prototype. Every tree, farmer, measurement, photo and price in
              this app is fictional demo data.
            </p>
            <button type="button" onClick={resetDemo} className="btn-secondary btn-small mt-5">
              Reset demo
            </button>
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
            <p className="text-[13px] font-semibold text-ink">Demo roles</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <Link to="/farmer" className="hover:text-canopy">Farmer Portal</Link>
              </li>
              <li>
                <Link to="/verification" className="hover:text-canopy">Verification</Link>
              </li>
              <li>
                <Link to="/experiments" className="hover:text-canopy">Experiments</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <p className="text-sm text-ink-muted">
            The tree is planted once. Its value is measured every year.
          </p>
        </div>
      </div>
    </footer>
  )
}
