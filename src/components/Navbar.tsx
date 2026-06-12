import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  title?: string
}

const Navbar = ({ title = 'Dashboard' }: NavbarProps) => {
  const { user } = useAuth()

  // Capitalize name helper for navbar
  const getUserName = () => {
    if (!user?.userId) return 'Alex Wando'
    if (user.userId === 'vedant-admin') return 'Alex Wando' // Maintain requested avatar name or fallback
    return user.userId
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  return (
    <header className="h-[70px] bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between shadow-sm shrink-0">
      <h1 className="text-xl font-bold text-[#1E2139]">{title}</h1>

      {/* User controls / notification */}
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-[#4361EE] rounded-full hover:bg-[#F8F9FA] transition duration-200 cursor-pointer">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#4361EE] rounded-full"></span>
        </button>

        {/* User Info Block */}
        <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-6">
          {/* Profile Image/Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-2 ring-[#4361EE]/10">
            <img
              src="https://api.dicebear.com/7.x/adventurer/svg?seed=Alex"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Identity Details */}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1E2139] leading-tight">{getUserName()}</span>
            <span className="text-xs text-gray-500">{user?.role || 'Admin'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
