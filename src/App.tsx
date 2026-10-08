import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Build from './pages/Build'
import Dashboard from './pages/Dashboard'
import Studio from './pages/Studio'
import Portal from './pages/Portal'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { useAuth } from './hooks/useAuth'

/** After OAuth the platform lands on "/"; honour any ?next= the user had. */
function PostLoginRedirect() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (isAuthenticated) {
      const next = sessionStorage.getItem('bk360_next')
      if (next) {
        sessionStorage.removeItem('bk360_next')
        navigate(next)
      }
    }
  }, [isAuthenticated, navigate])
  return null
}

export default function App() {
  return (
    <>
      <PostLoginRedirect />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/build" element={<Build />} />
        <Route path="/checkout/:slug" element={<Checkout />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/studio/:brandId" element={<Studio />} />
        <Route path="/portal/:brandId" element={<Portal />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
