import { Outlet, Link, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-primary">
      <nav className="border-b border-border bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-medium text-accent">
            SkyReader
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={location.pathname === '/' || location.pathname === '' ? 'text-accent font-medium' : 'text-muted hover:text-primary'}>
              Sky
            </Link>
            <Link to="/log" className={location.pathname === '/log' ? 'text-accent font-medium' : 'text-muted hover:text-primary'}>
              Log
            </Link>
            <Link to="/atlas" className={location.pathname === '/atlas' ? 'text-accent font-medium' : 'text-muted hover:text-primary'}>
              Atlas
            </Link>
            <Link to="/settings" className={location.pathname === '/settings' ? 'text-accent font-medium' : 'text-muted hover:text-primary'}>
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <main className="py-4">
        <Outlet />
      </main>

      <nav className="border-t border-border bg-white/90 backdrop-blur-sm sticky bottom-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex-1 text-center font-medium text-accent">SkyReader</div>

          <div className="flex gap-2">
            <Link to="/" className={location.pathname === '/' || location.pathname === '' ? 'bg-accent text-primary' : 'text-muted hover:text-primary'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 6h14v5H3v-5z"/>
              </svg>
              Sky
            </Link>
            <Link to="/log" className={location.pathname === '/log' ? 'bg-accent text-primary' : 'text-muted hover:text-primary'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8l-6-4"/>
              </svg>
              Log
            </Link>
            <Link to="/atlas" className={location.pathname === '/atlas' ? 'bg-accent text-primary' : 'text-muted hover:text-primary'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 7v7l5 5"/>
              </svg>
              Atlas
            </Link>
            <Link to="/settings" className={location.pathname === '/settings' ? 'bg-accent text-primary' : 'text-muted hover:text-primary'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}