import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

// Validation schema
const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormFields = z.infer<typeof loginSchema>

const Login = () => {
  const { loginUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormFields) => {
    setApiError(null)
    setIsLoading(true)
    try {
      const response = await login(data.userId, data.password)
      if (response.success && response.data) {
        loginUser(response.data.token, response.data.user)
        navigate('/')
      } else {
        setApiError(response.message || 'Login failed. Please verify your credentials.')
      }
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 
        err.message || 
        'Invalid User ID or Password. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] font-sans">
      {/* Left side - Science Illustration Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F0F4F8] flex-col justify-center items-center p-12 border-r border-[#E2E8F0]">
        <div className="w-full max-w-lg flex flex-col items-center">
          {/* Beaker Character Illustration SVG */}
          <svg
            viewBox="0 0 600 500"
            fill="none"
            className="w-full h-auto drop-shadow-sm hover:scale-[1.01] transition-transform duration-500 ease-out"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background floating sparkle elements */}
            <g transform="translate(100, 180)" className="animate-pulse">
              <path d="M-10 0 H10 M0 -10 V10" stroke="#4361EE" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <g transform="translate(480, 260)" className="animate-pulse" style={{ animationDelay: '1s' }}>
              <path d="M-8 0 H8 M0 -8 V8" stroke="#4361EE" strokeWidth="2" strokeLinecap="round" />
            </g>
            <circle cx="360" cy="150" r="5" stroke="#1E2139" strokeWidth="2.5" fill="none" opacity="0.6" className="animate-bounce" />

            {/* Table/Desk */}
            <line x1="60" y1="330" x2="540" y2="330" stroke="#1E2139" strokeWidth="6" strokeLinecap="round" />
            {/* Table Legs */}
            <line x1="110" y1="333" x2="110" y2="460" stroke="#8E9AA8" strokeWidth="2.5" />
            <line x1="200" y1="333" x2="200" y2="460" stroke="#8E9AA8" strokeWidth="2.5" />
            <line x1="440" y1="333" x2="440" y2="460" stroke="#8E9AA8" strokeWidth="2.5" />
            <line x1="510" y1="333" x2="510" y2="460" stroke="#8E9AA8" strokeWidth="2.5" />

            {/* Beaker Stand & Base */}
            <rect x="250" y="445" width="80" height="10" rx="5" fill="#4361EE" opacity="0.2" />
            <rect x="260" y="437" width="60" height="8" rx="4" fill="#4361EE" opacity="0.4" />
            {/* Vertical stand rod */}
            <line x1="290" y1="330" x2="290" y2="437" stroke="#1E2139" strokeWidth="3" />

            {/* Beaker Character Main Body */}
            {/* Glass tube structure */}
            <rect x="260" y="170" width="60" height="230" rx="30" fill="#FFFFFF" stroke="#1E2139" strokeWidth="4" />
            
            {/* Blue Liquid fills (Bottom half of Beaker) */}
            {/* Liquid base */}
            <path d="M 262 340 Q 290 335 318 340 L 318 370 Q 290 380 262 370 Z" fill="#4361EE" opacity="0.2" />
            {/* Darker liquid layer */}
            <path d="M 262 370 L 262 375 C 262 386 271 398 290 398 C 309 398 318 386 318 375 L 318 370 Z" fill="#4361EE" opacity="0.4" />

            {/* Cylinder Lip / Flange at bottom */}
            <rect x="255" y="394" width="70" height="8" rx="3" fill="#D1E3F8" stroke="#1E2139" strokeWidth="3" />

            {/* Measurement lines */}
            <line x1="268" y1="210" x2="278" y2="210" stroke="#1E2139" strokeWidth="3" strokeLinecap="round" />
            <line x1="268" y1="235" x2="274" y2="235" stroke="#1E2139" strokeWidth="3" strokeLinecap="round" />
            <line x1="268" y1="260" x2="278" y2="260" stroke="#1E2139" strokeWidth="3" strokeLinecap="round" />
            <line x1="268" y1="285" x2="274" y2="285" stroke="#1E2139" strokeWidth="3" strokeLinecap="round" />
            <line x1="268" y1="310" x2="278" y2="310" stroke="#1E2139" strokeWidth="3" strokeLinecap="round" />

            {/* Character Face */}
            <circle cx="278" cy="250" r="3.5" fill="#1E2139" />
            <circle cx="302" cy="250" r="3.5" fill="#1E2139" />
            <path d="M 286 257 Q 290 260 294 257" stroke="#1E2139" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Graduation Mortarboard Cap */}
            {/* Skull Cap segment */}
            <rect x="270" y="162" width="40" height="10" fill="#1E2139" rx="2" />
            {/* Diamond Plate */}
            <polygon points="290,135 335,147 290,159 245,147" fill="#4361EE" stroke="#1E2139" strokeWidth="3.5" strokeLinejoin="round" />
            <polygon points="290,138 328,147 290,156 252,147" fill="#D1E3F8" />
            {/* Tassel */}
            <path d="M 290 147 L 325 152 L 325 178" stroke="#1E2139" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="325" cy="180" r="3" fill="#1E2139" />

            {/* Laptop Desk Unit */}
            {/* Laptop Open Screen */}
            <polygon points="120,210 240,213 220,330 130,330" fill="#FFFFFF" stroke="#1E2139" strokeWidth="4" strokeLinejoin="round" />
            <polygon points="126,216 233,219 216,324 136,324" fill="#F8F9FA" />
            {/* Laptop Keyboard Base */}
            <polygon points="130,330 220,330 245,340 105,340" fill="#D1E3F8" stroke="#1E2139" strokeWidth="4" strokeLinejoin="round" />
            <line x1="140" y1="335" x2="210" y2="335" stroke="#1E2139" strokeWidth="3" strokeLinecap="round" />

            {/* Arms */}
            {/* Left Arm (Beaker -> Laptop keyboard) */}
            <path d="M 260 280 C 215 280 195 295 165 315" stroke="#1E2139" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Right Arm (Beaker -> resting/writing) */}
            <path d="M 320 280 C 345 280 365 295 355 318 C 350 325 335 322 320 318" stroke="#1E2139" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Right side - Login Form Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Section */}
          <div className="flex justify-start">
            <div className="flex items-center gap-1 font-sans">
              <span className="text-2xl font-black text-[#1E2139] tracking-tight">Prep</span>
              <span className="text-2xl font-black text-[#4361EE] tracking-tight relative">
                route
                {/* Curved dotted line illustrating 'route' */}
                <svg
                  className="absolute -top-[10px] left-[-70px] w-[130px] h-[22px]"
                  viewBox="0 0 130 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 5 18 C 35 3, 95 3, 125 18"
                    stroke="#1E2139"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    fill="none"
                  />
                  <circle cx="125" cy="18" r="2.5" fill="#4361EE" />
                </svg>
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold text-[#1E2139]">Login</h2>
            <p className="mt-2 text-sm text-[#5F6368]">
              Use your company provided Login credentials
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* User ID Field */}
              <div>
                <label htmlFor="userId" className="block text-sm font-semibold text-[#1E2139] mb-2">
                  User ID
                </label>
                <input
                  id="userId"
                  type="text"
                  placeholder="Enter User ID"
                  {...register('userId')}
                  className={`w-full px-4 py-3 rounded-lg border bg-[#F8F9FA] text-[#1E2139] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 transition duration-200 ${
                    errors.userId
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-[#E2E8F0] focus:ring-[#4361EE]/20 focus:border-[#4361EE]'
                  }`}
                />
                {errors.userId && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.userId.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#1E2139] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter Password"
                  {...register('password')}
                  className={`w-full px-4 py-3 rounded-lg border bg-[#F8F9FA] text-[#1E2139] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 transition duration-200 ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-[#E2E8F0] focus:ring-[#4361EE]/20 focus:border-[#4361EE]'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-semibold text-[#4361EE] hover:text-[#304FF5] transition duration-200"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button & General API Error */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-[#4361EE] hover:bg-[#304FF5] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>

              {apiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-fadeIn">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login