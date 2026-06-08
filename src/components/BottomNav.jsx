import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const tabs = [
  { to: '/', label: 'Browse', icon: '🏠' },
  { to: '/post', label: 'Post', icon: '➕' },
  { to: '/about', label: 'About', icon: 'ℹ️' },
  { to: '/my-books', label: 'My Books', icon: '👤' },
]

export default function BottomNav() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] bg-white border-t border-primary/10 shadow-lg pointer-events-auto">
        <div className="flex">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-primary/50'
                }`
              }
            >
              <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
