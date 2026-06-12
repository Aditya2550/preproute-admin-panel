import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { getAllTests, deleteTest } from '../api/tests'
import type { Test } from '../types'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const Dashboard = () => {
  const navigate = useNavigate()


  // State Management
  const [tests, setTests] = useState<Test[]>([])
  const [filteredTests, setFilteredTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [testToDelete, setTestToDelete] = useState<Test | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch Tests on Mount
  const fetchTests = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getAllTests()
      if (response.success && response.data) {
        setTests(response.data)
        setFilteredTests(response.data)
      } else {
        setError(response.message || 'Failed to retrieve tests.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching tests.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [])

  // Handle Search and Filters
  useEffect(() => {
    let result = [...tests]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (subjectFilter !== 'all') {
      result = result.filter((t) => t.subject.toLowerCase() === subjectFilter.toLowerCase())
    }

    setFilteredTests(result)
  }, [searchQuery, statusFilter, subjectFilter, tests])

  // Get unique subjects for filter dropdown
  const uniqueSubjects = Array.from(new Set(tests.map((t) => t.subject))).filter(Boolean)

  // Handle Delete Click
  const openDeleteModal = (test: Test) => {
    setTestToDelete(test)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setTestToDelete(null)
    setIsDeleteModalOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (!testToDelete) return
    setIsDeleting(true)
    try {
      const response = await deleteTest(testToDelete.id)
      if (response.success) {
        // Refresh local tests state
        setTests((prev) => prev.filter((t) => t.id !== testToDelete.id))
        closeDeleteModal()
      } else {
        alert(response.message || 'Failed to delete test.')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during deletion.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Formatting helper for date
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#1E2139] font-sans">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Navbar */}
        <Navbar title="Dashboard" />

        {/* Inner Main Content Pane */}
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {/* Header Action Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#1E2139]">Test Creation</h2>
              <p className="text-sm text-gray-500 mt-1">Manage and track your question papers, drafts, and mock exams.</p>
            </div>

            <button
              onClick={() => navigate('/create-test')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4361EE] hover:bg-[#304FF5] text-white rounded-lg font-bold text-sm shadow-md shadow-[#4361EE]/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Create New Test</span>
            </button>
          </div>

          {/* Filters & Search Bar Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search test by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] transition duration-200"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Subject Filter */}
              <div>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  {uniqueSubjects.map((subject) => (
                    <option key={subject} value={subject.toLowerCase()}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1E2139] font-semibold focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="live">Live</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-[#4361EE]" size={40} />
                <span className="text-sm font-semibold text-gray-500">Retrieving tests...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <AlertCircle className="text-red-500 mb-3" size={40} />
                <h3 className="text-lg font-bold text-[#1E2139]">Failed to load tests</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">{error}</p>
                <button
                  onClick={fetchTests}
                  className="mt-4 px-4 py-2 border border-[#4361EE] text-[#4361EE] hover:bg-[#4361EE] hover:text-white rounded-lg text-sm font-semibold transition duration-200 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <HelpCircle className="text-gray-400 mb-3" size={40} />
                <h3 className="text-lg font-bold text-[#1E2139]">No tests found</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  {searchQuery || statusFilter !== 'all' || subjectFilter !== 'all'
                    ? 'No tests match your current search queries or filters.'
                    : 'Click "Create New Test" to get started creating test content.'}
                </p>
                {(searchQuery || statusFilter !== 'all' || subjectFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setSubjectFilter('all')
                    }}
                    className="mt-4 px-4 py-2 bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#1E2139] rounded-lg text-sm font-semibold transition duration-200 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8F9FA] text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Test Name</th>
                      <th className="py-4 px-6">Subject</th>
                      <th className="py-4 px-6">Topics</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Created Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-sm">
                    {filteredTests.map((test) => (
                      <tr
                        key={test.id}
                        className="hover:bg-slate-50/50 transition-colors duration-150"
                      >
                        {/* Test Name */}
                        <td className="py-4 px-6 font-bold text-[#1E2139] max-w-[240px] truncate">
                          {test.name}
                        </td>

                        {/* Subject */}
                        <td className="py-4 px-6 text-gray-600 font-semibold">{test.subject}</td>

                        {/* Topics */}
                        <td className="py-4 px-6 max-w-[240px]">
                          <div className="flex flex-wrap gap-1.5">
                            {test.topics && test.topics.length > 0 ? (
                              test.topics.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#4361EE]/10 text-[#4361EE]"
                                >
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 italic">No topics selected</span>
                            )}
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-4 px-6">
                          {test.status === 'live' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                              Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-6 text-gray-500 font-medium">
                          {formatDate(test.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* View button */}
                            <button
                              onClick={() => navigate(`/preview/${test.id}`)}
                              title="Preview Test"
                              className="p-1.5 text-gray-500 hover:text-[#4361EE] hover:bg-slate-100 rounded-md transition duration-200 cursor-pointer"
                            >
                              <Eye size={16} />
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => navigate(`/edit-test/${test.id}`)}
                              title="Edit Test"
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition duration-200 cursor-pointer"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => openDeleteModal(test)}
                              title="Delete Test"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-slate-100 rounded-md transition duration-200 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Confirm Delete Dialog Modal */}
      {isDeleteModalOpen && testToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#1E2139]">Delete Test</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete <strong className="text-[#1E2139]">"{testToDelete.name}"</strong>? This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition duration-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/10 transition duration-200 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  'Delete Test'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard