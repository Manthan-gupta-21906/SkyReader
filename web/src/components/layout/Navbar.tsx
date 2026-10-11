/**
 * Navigation Bar component providing responsive desktop header and mobile bottom bar.
 */

import { Link, useLocation } from 'react-router-dom'
import { SkyIcon, LogIcon, AtlasIcon, SettingsIcon } from '../icons/Icons'

const NAV_ITEMS = [
  { path: '/', label: 'Sky', icon: SkyIcon },
  { path: '/log', label: 'Log', icon: LogIcon },
  { path: '/atlas', label: 'Atlas', icon: AtlasIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
] as const

export function Navbar() {
  const location = useLocation()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <>
      {/* Desktop Top Navigation Bar */}
      <nav
        className="nav-bar hidden md:block border-b sticky top-0 z-50 backdrop-blur-xl bg-[rgba(10,14,26,0.8)] border-[rgba(255,255,255,0.08)]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <span className="text-2xl filter drop-shadow">🔭</span>
            <span className="glow-text font-black">SkyReader</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`nav-link-desktop ${isActive(path) ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="nav-bar md:hidden fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-xl bg-[rgba(10,14,26,0.92)] border-[rgba(255,255,255,0.08)]"
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive(path) ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
