import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Clock,
  BookOpen,
  FileText,
  BarChart,
  Edit2,
  CheckCircle,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { fetchBulkQuestions } from '../api/questions'
import { publishTest, getTestById } from '../api/tests'
import { useTest } from '../context/TestContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import type { Question } from '../types'

const Preview = () => {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const { currentTest, setCurrentTest } = useTest()

  // State Management
  const [questionsList, setQuestionsList] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal States
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [liveUntil, setLiveUntil] = useState<string>('always')
  const [customDate, setCustomDate] = useState<string>('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublishSuccess, setIsPublishSuccess] = useState(false)

  // Populate dynamic default date when custom duration is selected
  useEffect(() => {
    if (liveUntil === 'custom' && !customDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(12, 0, 0, 0)
      const pad = (n: number) => n.toString().padStart(2, '0')
      const formatted = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
      setCustomDate(formatted)
    }
  }, [liveUntil, customDate])

  // Fetch Test & Bulk Questions
  useEffect(() => {
    const fetchPreviewData = async () => {
      if (!testId) return
      setIsLoading(true)
      setError(null)
      try {
        let activeTest = currentTest
        // If context test is missing or ID mismatch, fetch it
        if (!activeTest || activeTest.id !== testId) {
          const res = await getTestById(testId)
          if (res.success && res.data) {
            activeTest = res.data
            setCurrentTest(res.data)
          } else {
            throw new Error(res.message || 'Failed to load test.')
          }
        }

        if (activeTest) {
          if (activeTest.questions && activeTest.questions.length > 0) {
            const questionRes = await fetchBulkQuestions(activeTest.questions)
            if (questionRes.success && questionRes.data) {
              setQuestionsList(questionRes.data)
            } else {
              throw new Error(questionRes.message || 'Failed to load test questions.')
            }
          } else {
            setQuestionsList([])
          }
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'An error occurred while loading test preview details.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreviewData()
  }, [testId, currentTest, setCurrentTest])

  // Handle test publishing
  const handlePublishConfirm = async () => {
    if (!testId) return
    setIsPublishing(true)
    setError(null)
    try {
      const res = await publishTest(testId)
      if (res.success) {
        // Sync status in context if returned
        if (res.data) {
          setCurrentTest(res.data)
        } else if (currentTest) {
          setCurrentTest({ ...currentTest, status: 'live' })
        }
        setIsPublishSuccess(true)
        // Auto redirect after 2 seconds
        setTimeout(() => {
          setIsPublishModalOpen(false)
          setIsPublishSuccess(false)
          navigate('/')
        }, 2000)
      } else {
        throw new Error(res.message || 'Failed to publish test.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while publishing the test.')
      setIsPublishModalOpen(false)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#1E2139] font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Test Creation" />

        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto flex flex-col">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
            <span>Test Creation</span>
            <ChevronRight size={14} className="text-gray-400" />
            <span>Create Test</span>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-[#4361EE] capitalize">
              {currentTest?.type === 'chapterwise'
                ? 'Chapter Wise'
                : currentTest?.type === 'pyq'
                ? 'PYQ'
                : currentTest?.type === 'mock'
                ? 'Mock Test'
                : 'Chapter Wise'}
            </span>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-20 flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#4361EE]" size={40} />
              <span className="text-sm font-semibold text-gray-500">Loading test preview...</span>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-20 flex-1 flex flex-col items-center justify-center text-center px-4">
              <AlertCircle className="text-red-500 mb-3" size={40} />
              <h3 className="text-lg font-bold text-[#1E2139]">Failed to load preview</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-5 py-2.5 bg-[#4361EE] hover:bg-[#304FF5] text-white rounded-lg text-sm font-bold shadow-md transition duration-200 cursor-pointer"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Top Banner section */}
                {currentTest && (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#4361EE] bg-[#4361EE]/10 px-2.5 py-1 rounded-md">
                            {currentTest.type === 'chapterwise'
                              ? 'Chapter Wise Test'
                              : currentTest.type === 'pyq'
                              ? 'PYQ Test'
                              : 'Mock Exam'}
                          </span>
                          {currentTest.status === 'live' ? (
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
                        </div>
                        <h2 className="text-2xl font-bold text-[#1E2139]">{currentTest.name}</h2>

                        {/* Topics badges */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {currentTest.topics && currentTest.topics.length > 0 ? (
                            currentTest.topics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#4361EE]/10 text-[#4361EE] border border-[#4361EE]/20"
                              >
                                {topic}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No topics specified</span>
                          )}
                        </div>
                      </div>

                      {/* Info metrics grid & edit button */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 lg:self-end">
                        <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3.5 py-2 rounded-lg">
                          <BookOpen size={14} className="text-gray-400" />
                          <span>Subject: <strong className="text-[#1E2139]">{currentTest.subject}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3.5 py-2 rounded-lg">
                          <Clock size={14} className="text-gray-400" />
                          <span>Duration: <strong className="text-[#1E2139]">{currentTest.total_time} mins</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3.5 py-2 rounded-lg">
                          <FileText size={14} className="text-gray-400" />
                          <span>Questions: <strong className="text-[#1E2139]">{currentTest.total_questions} Qs</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3.5 py-2 rounded-lg">
                          <BarChart size={14} className="text-gray-400" />
                          <span>Total Marks: <strong className="text-[#1E2139]">{currentTest.total_marks} Marks</strong></span>
                        </div>

                        <button
                          onClick={() => navigate(`/edit-test/${testId}`)}
                          className="flex items-center gap-2 px-4 py-2 border border-[#4361EE] hover:bg-[#4361EE]/5 text-[#4361EE] rounded-lg font-bold transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm"
                        >
                          <Edit2 size={14} />
                          <span>Edit Test</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions Listing */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-6">
                    <h3 className="text-lg font-bold text-[#1E2139] flex items-center gap-2">
                      <FileText size={20} className="text-[#4361EE]" />
                      <span>Test Questions List</span>
                    </h3>
                    <span className="text-xs font-bold text-gray-500">
                      Total Added: {questionsList.length}
                    </span>
                  </div>

                  {questionsList.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-gray-400">
                      <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                      <h4 className="font-bold text-[#1E2139] mb-1">No questions found</h4>
                      <p className="text-sm">There are no questions in this test yet. Click the Edit button above to add questions.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {questionsList.map((q, idx) => (
                        <div key={q.id || idx} className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                Question {idx + 1}
                              </span>
                              <p className="font-bold text-[#1E2139] text-base leading-relaxed">
                                {q.question}
                              </p>
                            </div>
                            {q.difficulty && (
                              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border shrink-0 ${
                                q.difficulty === 'easy'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : q.difficulty === 'medium'
                                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                                  : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                {q.difficulty}
                              </span>
                            )}
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { key: 'option1', text: q.option1 },
                              { key: 'option2', text: q.option2 },
                              { key: 'option3', text: q.option3 },
                              { key: 'option4', text: q.option4 },
                            ].map((opt) => {
                              const isCorrect = q.correct_option === opt.key
                              return (
                                <div
                                  key={opt.key}
                                  className={`p-3.5 rounded-lg border text-sm font-semibold flex items-center gap-3 transition-colors duration-150 ${
                                    isCorrect
                                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                      : 'bg-[#F8F9FA] border-[#E2E8F0] text-gray-700'
                                  }`}
                                >
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}
                                  >
                                    {opt.key === 'option1' ? 'A' : opt.key === 'option2' ? 'B' : opt.key === 'option3' ? 'C' : 'D'}
                                  </div>
                                  <span className="flex-1">{opt.text}</span>
                                  {isCorrect && (
                                    <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Explanation if present */}
                          {q.explanation && (
                            <div className="p-4 rounded-lg bg-blue-50/30 border border-blue-100 text-sm">
                              <span className="font-bold text-blue-900 block mb-1">Explanation:</span>
                              <p className="text-blue-800 leading-relaxed font-medium">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Right Publish Action Button */}
              <div className="flex justify-end mt-8 pt-6 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  disabled={questionsList.length === 0 || currentTest?.status === 'live'}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Publish Test</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal overlay */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-6 animate-fadeIn">
            {isPublishSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce">
                  <CheckCircle size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#1E2139]">Test Published Successfully!</h3>
                  <p className="text-sm text-gray-500">
                    Your test paper is now live and available. Redirecting to dashboard...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <h3 className="text-lg font-bold text-[#1E2139]">Publish Confirmation</h3>
                  <button
                    onClick={() => setIsPublishModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Test Summary Card */}
                <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4361EE] bg-[#4361EE]/10 px-2 py-0.5 rounded-md">
                      {currentTest?.type === 'chapterwise' ? 'Chapter Wise' : currentTest?.type === 'pyq' ? 'PYQ' : 'Mock Test'}
                    </span>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                      {currentTest?.difficulty}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#1E2139] text-sm truncate">{currentTest?.name}</h4>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-gray-500">
                    <div>
                      Subject: <span className="text-[#1E2139] block font-bold truncate">{currentTest?.subject}</span>
                    </div>
                    <div>
                      Duration: <span className="text-[#1E2139] block font-bold">{currentTest?.total_time} min</span>
                    </div>
                    <div>
                      Questions: <span className="text-[#1E2139] block font-bold">{questionsList.length} total</span>
                    </div>
                  </div>
                </div>

                {/* Publish Now Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-[#1E2139] block">Publish Now</span>
                    <span className="text-xs text-gray-400">Make this test paper immediately active and visible.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={publishNow}
                      onChange={(e) => setPublishNow(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4361EE]"></div>
                  </label>
                </div>

                {/* Live Until Radios */}
                <div className="space-y-2.5">
                  <span className="text-sm font-bold text-[#1E2139] block">Live Until</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'always', label: 'Always Available' },
                      { id: '1week', label: '1 Week' },
                      { id: '1month', label: '1 Month' },
                      { id: 'custom', label: 'Custom Duration' },
                    ].map((opt) => {
                      const isSelected = liveUntil === opt.id
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-bold cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'border-[#4361EE] bg-[#4361EE]/5 text-[#4361EE]'
                              : 'border-[#E2E8F0] hover:border-gray-300 text-gray-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="liveUntil"
                            value={opt.id}
                            checked={isSelected}
                            onChange={() => setLiveUntil(opt.id)}
                            className="w-3.5 h-3.5 text-[#4361EE] border-gray-300 focus:ring-[#4361EE]"
                          />
                          <span>{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Date Time Picker */}
                {liveUntil === 'custom' && (
                  <div className="space-y-2 animate-fadeIn">
                    <label htmlFor="customDuration" className="block text-xs font-bold text-gray-500">
                      Select End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customDuration"
                      type="datetime-local"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] cursor-pointer"
                      required
                    />
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    disabled={isPublishing}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition duration-200 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishConfirm}
                    disabled={isPublishing}
                    className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#4361EE] hover:bg-[#304FF5] rounded-lg transition duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="animate-spin h-4.5 w-4.5" />
                        Publishing...
                      </>
                    ) : (
                      'Confirm Publish'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Preview