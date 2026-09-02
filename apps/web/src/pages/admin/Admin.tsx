import { NavLink, Route, Routes } from 'react-router-dom'
import { AdminOverview } from './AdminOverview'
import { AdminTrees } from './AdminTrees'
import { AdminFarmers } from './AdminFarmers'
import { AdminPayments } from './AdminPayments'
import { AdminSettings } from './AdminSettings'
import { AdminExperiments } from './AdminExperiments'
import { AdminLog } from './AdminLog'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/trees', label: 'Trees' },
  { to: '/admin/farmers', label: 'Farmers' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/experiments', label: 'Experiments' },
  { to: '/admin/log', label: 'Audit log' },
]

export function Admin() {
  useDocumentTitle('Admin')
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">Admin</h1>
      <nav className="mt-6 flex flex-wrap gap-1 border-b border-line pb-3" aria-label="Admin sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `rounded-full px-3 py-1.5 text-[14px] font-medium ${isActive ? 'bg-canopy-soft text-canopy-deep' : 'text-ink-soft hover:text-ink'}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="trees" element={<AdminTrees />} />
          <Route path="farmers" element={<AdminFarmers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="experiments" element={<AdminExperiments />} />
          <Route path="log" element={<AdminLog />} />
        </Routes>
      </div>
    </div>
  )
}
