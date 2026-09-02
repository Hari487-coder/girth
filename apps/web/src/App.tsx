import { Navigate, Route, Routes } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { ScrollToTop } from './components/ScrollToTop'
import { RequireRole } from './lib/session'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Marketplace } from './pages/Marketplace'
import { PublicTree } from './pages/PublicTree'
import { SponsorFlow } from './pages/SponsorFlow'
import { MyTrees } from './pages/MyTrees'
import { Farm } from './pages/farm/Farm'
import { Measure } from './pages/farm/Measure'
import { Queue } from './pages/review/Queue'
import { Audits } from './pages/review/Audits'
import { Admin } from './pages/admin/Admin'
import { Programs } from './pages/org/Programs'

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/trees" element={<Marketplace />} />
          <Route path="/tree/:publicId" element={<PublicTree />} />
          <Route path="/trees/:publicId" element={<RedirectTree />} />
          <Route
            path="/tree/:publicId/sponsor"
            element={
              <RequireRole roles={['CUSTOMER', 'ADMIN']}>
                <SponsorFlow />
              </RequireRole>
            }
          />
          <Route
            path="/my-trees"
            element={
              <RequireRole roles={['CUSTOMER']}>
                <MyTrees />
              </RequireRole>
            }
          />
          <Route
            path="/farm"
            element={
              <RequireRole roles={['FARMER']}>
                <Farm />
              </RequireRole>
            }
          />
          <Route
            path="/farm/measure"
            element={
              <RequireRole roles={['FARMER', 'FIELD_AUDITOR', 'ADMIN']}>
                <Measure />
              </RequireRole>
            }
          />
          <Route
            path="/farm/measure/:publicId"
            element={
              <RequireRole roles={['FARMER', 'FIELD_AUDITOR', 'ADMIN']}>
                <Measure />
              </RequireRole>
            }
          />
          <Route
            path="/review"
            element={
              <RequireRole roles={['FIELD_AUDITOR', 'ADMIN']}>
                <Queue />
              </RequireRole>
            }
          />
          <Route
            path="/audits"
            element={
              <RequireRole roles={['FIELD_AUDITOR', 'ADMIN']}>
                <Audits />
              </RequireRole>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RequireRole roles={['ADMIN']}>
                <Admin />
              </RequireRole>
            }
          />
          <Route
            path="/org"
            element={
              <RequireRole roles={['ORGANISATION', 'ADMIN']}>
                <Programs />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

/** Old demo links used /trees/GIRTH-001; the public page now lives at /tree/:id. */
function RedirectTree() {
  const publicId = window.location.pathname.split('/').pop() ?? ''
  return <Navigate to={`/tree/${publicId}`} replace />
}
