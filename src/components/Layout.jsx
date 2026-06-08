import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1 w-full min-w-0 max-w-[430px] md:max-w-2xl mx-auto px-4 pt-4 pb-24 overflow-x-hidden">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
