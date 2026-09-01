import { Navigate, Route, Routes } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { ScrollToTop } from './components/ScrollToTop'
import { Landing } from './pages/Landing'
import { Marketplace } from './pages/Marketplace'
import { TreeProfile } from './pages/TreeProfile'
import { SponsorFlow } from './pages/SponsorFlow'
import { MyTrees } from './pages/MyTrees'
import { Farmer } from './pages/Farmer'
import { Verification } from './pages/Verification'
import { Experiments } from './pages/Experiments'

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/trees" element={<Marketplace />} />
          <Route path="/trees/:id" element={<TreeProfile />} />
          <Route path="/trees/:id/sponsor" element={<SponsorFlow />} />
          <Route path="/my-trees" element={<MyTrees />} />
          <Route path="/farmer" element={<Farmer />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
