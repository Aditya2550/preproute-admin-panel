import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus,
  LineChart,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { logoutUser } = useAuth()
  const location = useLocation()

  return (
    <aside className="w-[260px] bg-[#1E2139] text-white flex flex-col justify-between shrink-0 select-none shadow-xl">
      <div className="flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10 flex items-center justify-start gap-1">
          <span className="text-xl font-black text-white tracking-tight">Prep</span>
          <span className="text-xl font-black text-[#4361EE] tracking-tight relative">
            route
            {/* Curved dotted line */}
            <svg
              className="absolute -top-[8px] left-[-60px] w-[110px] h-[18px]"
              viewBox="0 0 110 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 5 15 C 30 2, 80 2, 105 15"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeDasharray="3 3"
                fill="none"
                opacity="0.8"
              />
              <circle cx="105" cy="15" r="2" fill="#4361EE" />
            </svg>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="mt-8 px-4 space-y-2">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              location.pathname === '/'
                ? 'bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/create-test"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              location.pathname.startsWith('/create-test') ||
              location.pathname.startsWith('/edit-test') ||
              location.pathname.startsWith('/add-questions') ||
              location.pathname.startsWith('/preview')
                ? 'bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FilePlus size={18} />
            <span>Test Creation</span>
          </Link>

          <button
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-500 cursor-not-allowed text-left"
          >
            <LineChart size={18} />
            <span>Test Tracking</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logoutUser}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
