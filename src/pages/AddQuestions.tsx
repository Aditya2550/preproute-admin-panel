import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, ChevronRight, Plus, Trash2, BookOpen, Clock, BarChart, FileText } from 'lucide-react'

import { getSubjects, getTopicsBySubject, getSubTopicsByTopics } from '../api/subjects'
import { updateTest, getTestById } from '../api/tests'
import { bulkCreateQuestions, fetchBulkQuestions } from '../api/questions'
import { useTest } from '../context/TestContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import type { Subject, Topic, SubTopic, Test, Question } from '../types'

// Zod validation schema for Question Form
const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  option1: z.string().min(1, 'Option 1 is required'),
  option2: z.string().min(1, 'Option 2 is required'),
  option3: z.string().min(1, 'Option 3 is required'),
  option4: z.string().min(1, 'Option 4 is required'),
  correct_option: z.enum(['option1', 'option2', 'option3', 'option4'], {
    message: 'Please select the correct option',
  }),
  explanation: z.string().optional(),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
  subTopic: z.string().optional(),
})

type QuestionFormValues = z.infer<typeof questionSchema>

const AddQuestions = () => {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const { currentTest, setCurrentTest } = useTest()

  // Component States
  const [testDetails, setTestDetails] = useState<Test | null>(currentTest)
  const [questionsList, setQuestionsList] = useState<Question[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subTopics, setSubTopics] = useState<SubTopic[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isTopicsLoading, setIsTopicsLoading] = useState(false)
  const [isSubTopicsLoading, setIsSubTopicsLoading] = useState(false)
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // React Hook Form Configuration
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_option: undefined,
      explanation: '',
      difficulty: 'medium',
      topic: '',
      subTopic: '',
    },
  })

  // Form Watchers
  const watchedTopic = watch('topic')
  const watchedCorrectOption = watch('correct_option')

  // Register overrides to handle resetting dependent options
  const { onChange: onTopicChange, ...topicReg } = register('topic')

  // Load Test Data and matching Subjects / Topics on Mount
  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) return
      setIsLoading(true)
      setPageError(null)
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
          setTestDetails(activeTest)

          // Fetch subjects to match name -> ID
          const subRes = await getSubjects()
          if (subRes.success && subRes.data) {
            // Find matching subject ID
            const matchedSubject = subRes.data.find(
              (s: Subject) => s.name.toLowerCase() === activeTest.subject.toLowerCase()
            )

            if (matchedSubject) {
              // Fetch topics for this subject
              setIsTopicsLoading(true)
              const topicRes = await getTopicsBySubject(matchedSubject.id)
              if (topicRes.success && topicRes.data) {
                setTopics(topicRes.data)
              }
              setIsTopicsLoading(false)
            }
          }

          // Fetch existing questions if they are already in the test
          if (activeTest.questions && activeTest.questions.length > 0) {
            const questionRes = await fetchBulkQuestions(activeTest.questions)
            if (questionRes.success && questionRes.data) {
              setQuestionsList(questionRes.data)
            }
          }
        }
      } catch (err: any) {
        console.error(err)
        setPageError(err.message || 'An error occurred while loading test data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestData()
  }, [testId, currentTest, setCurrentTest])

  // Fetch subtopics on topic changes
  useEffect(() => {
    if (watchedTopic && !isLoading) {
      const fetchSubTopics = async () => {
        setIsSubTopicsLoading(true)
        try {
          const res = await getSubTopicsByTopics([watchedTopic])
          if (res.success && res.data) {
            setSubTopics(res.data)
          } else {
            setSubTopics([])
          }
        } catch (err) {
          console.error(err)
          setSubTopics([])
        } finally {
          setIsSubTopicsLoading(false)
        }
      }
      fetchSubTopics()
    } else {
      setSubTopics([])
    }
  }, [watchedTopic, isLoading])

  // Load question for editing
  const handleEditQuestion = async (index: number) => {
    const q = questionsList[index]
    setEditingIndex(index)
    setPageError(null)

    // Pre-load subtopics if editing question has a topic ID
    if (q.topic_id) {
      setIsSubTopicsLoading(true)
      try {
        const res = await getSubTopicsByTopics([q.topic_id])
        if (res.success && res.data) {
          setSubTopics(res.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSubTopicsLoading(false)
      }
    } else {
      setSubTopics([])
    }

    reset({
      question: q.question,
      option1: q.option1,
      option2: q.option2,
      option3: q.option3,
      option4: q.option4,
      correct_option: q.correct_option as 'option1' | 'option2' | 'option3' | 'option4',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      topic: q.topic_id || '',
      subTopic: q.sub_topic_id || '',
    })
  }

  // Clear editing state and reset form
  const handleCancelEdit = () => {
    setEditingIndex(null)
    reset({
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_option: undefined,
      explanation: '',
      difficulty: 'medium',
      topic: '',
      subTopic: '',
    })
  }

  // Delete question from local list
  const handleDeleteQuestion = (index: number, event: React.MouseEvent) => {
    event.stopPropagation()
    const updated = questionsList.filter((_, idx) => idx !== index)
    setQuestionsList(updated)

    if (editingIndex === index) {
      handleCancelEdit()
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
  }

  // Add or Update Question in local array
  const onSubmitQuestion = (data: QuestionFormValues) => {
    const questionData: Question = {
      type: 'mcq',
      question: data.question,
      option1: data.option1,
      option2: data.option2,
      option3: data.option3,
      option4: data.option4,
      correct_option: data.correct_option,
      explanation: data.explanation || undefined,
      difficulty: data.difficulty || undefined,
      test_id: testId || '',
      topic_id: data.topic || undefined,
      sub_topic_id: data.subTopic || undefined,
    }

    if (editingIndex !== null) {
      const updated = [...questionsList]
      updated[editingIndex] = questionData
      setQuestionsList(updated)
      setEditingIndex(null)
    } else {
      setQuestionsList([...questionsList, questionData])
    }

    // Reset Form fields
    reset({
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_option: undefined,
      explanation: '',
      difficulty: 'medium',
      topic: '',
      subTopic: '',
    })
  }

  // Save everything to DB & continue
  const handleSaveAndContinue = async () => {
    if (questionsList.length === 0) {
      setPageError('At least 1 question is required before saving and continuing.')
      return
    }

    setIsSavingAll(true)
    setPageError(null)
    try {
      // 1. Bulk create questions
      const bulkRes = await bulkCreateQuestions(questionsList)
      if (!bulkRes.success || !bulkRes.data) {
        throw new Error(bulkRes.message || 'Failed to save questions.')
      }

      // 2. Fetch returned IDs
      const questionIds = bulkRes.data.map((q: Question) => q.id).filter(Boolean) as string[]

      // 3. Update the parent test
      if (testId) {
        const testRes = await updateTest(testId, {
          questions: questionIds,
          total_questions: questionsList.length,
        })

        if (!testRes.success || !testRes.data) {
          throw new Error(testRes.message || 'Failed to link questions to the test.')
        }

        // Update context test details
        setCurrentTest(testRes.data)
        navigate(`/preview/${testId}`)
      }
    } catch (err: any) {
      console.error(err)
      setPageError(err.message || 'An error occurred while saving questions.')
    } finally {
      setIsSavingAll(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#1E2139] font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Test Creation" />

        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto flex flex-col">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
            <span>Test Creation</span>
            <ChevronRight size={14} className="text-gray-400" />
            <span>Create Test</span>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-[#4361EE] capitalize">
              {testDetails?.type === 'chapterwise'
                ? 'Chapter Wise'
                : testDetails?.type === 'pyq'
                ? 'PYQ'
                : testDetails?.type === 'mock'
                ? 'Mock Test'
                : 'Chapter Wise'}
            </span>
          </div>

          {/* Test Metadata Banner */}
          {testDetails && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4361EE] bg-[#4361EE]/10 px-2.5 py-1 rounded-md">
                    {testDetails.type === 'chapterwise' ? 'Chapter Wise Test' : testDetails.type === 'pyq' ? 'PYQ Test' : 'Mock Exam'}
                  </span>
                  <h2 className="text-xl font-bold text-[#1E2139]">{testDetails.name}</h2>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
                  <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
                    <BookOpen size={14} className="text-gray-400" />
                    <span>Subject: <strong>{testDetails.subject}</strong></span>
                  </div>
                  {testDetails.topics && testDetails.topics.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
                      <FileText size={14} className="text-gray-400" />
                      <span>Topic: <strong>{testDetails.topics[0]}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
                    <Clock size={14} className="text-gray-400" />
                    <span>Duration: <strong>{testDetails.total_time} mins</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
                    <BarChart size={14} className="text-gray-400" />
                    <span>Total Target: <strong>{testDetails.total_questions} Questions ({testDetails.total_marks} Marks)</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-20 flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#4361EE]" size={40} />
              <span className="text-sm font-semibold text-gray-500">Loading configurations...</span>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Added Questions List */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-[640px]">
                <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8F9FA]">
                  <div>
                    <h3 className="font-bold text-[#1E2139] text-sm">Questions Added</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Progress: <strong>{questionsList.length}</strong> / {testDetails?.total_questions || 0}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#4361EE]/10 hover:bg-[#4361EE]/20 text-[#4361EE] rounded-lg font-bold text-xs transition duration-200 cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Add New</span>
                  </button>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {questionsList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <FileText size={36} className="mb-2 text-gray-300" />
                      <p className="text-sm font-semibold">No questions added yet</p>
                      <p className="text-xs mt-1">Configure and add questions from the form on the right.</p>
                    </div>
                  ) : (
                    questionsList.map((q, idx) => {
                      const isSelected = editingIndex === idx
                      return (
                        <div
                          key={idx}
                          onClick={() => handleEditQuestion(idx)}
                          className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-[#4361EE] bg-[#4361EE]/5 shadow-sm'
                              : 'border-[#E2E8F0] hover:border-gray-300 bg-white hover:shadow-xs'
                          }`}
                        >
                          <div className="pr-6">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                              Question {idx + 1}
                            </span>
                            <p className="text-xs font-semibold text-[#1E2139] line-clamp-2 leading-relaxed">
                              {q.question}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-1">
                            <div className="flex items-center gap-1.5">
                              {q.difficulty && (
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                  q.difficulty === 'easy'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : q.difficulty === 'medium'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-red-50 text-red-600 border border-red-100'
                                }`}>
                                  {q.difficulty}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-gray-500 uppercase">
                                Correct: {q.correct_option.replace('option', 'O')}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteQuestion(idx, e)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition duration-150 cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Question Creation Form */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-sm flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-6">
                  <h3 className="font-bold text-[#1E2139] text-base">
                    {editingIndex !== null ? `Edit Question ${editingIndex + 1}` : 'Configure MCQ Details'}
                  </h3>
                  {editingIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs font-bold text-gray-400 hover:text-[#4361EE] transition duration-200 cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmitQuestion)} className="space-y-6 flex-1">
                  
                  {/* Question Text */}
                  <div>
                    <label htmlFor="question" className="block text-sm font-bold text-[#1E2139] mb-2">
                      Question Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="question"
                      placeholder="Enter the question statement here..."
                      rows={3}
                      {...register('question')}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 resize-none ${
                        errors.question
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#E2E8F0] focus:border-[#4361EE]'
                      }`}
                    />
                    {errors.question && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                        <AlertCircle size={12} /> {errors.question.message}
                      </p>
                    )}
                  </div>

                  {/* MCQ Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1 */}
                    <div>
                      <label htmlFor="option1" className="block text-xs font-bold text-gray-600 mb-2">
                        Option 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="option1"
                        type="text"
                        placeholder="Option 1 content"
                        {...register('option1')}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                          errors.option1 ? 'border-red-500' : 'border-[#E2E8F0] focus:border-[#4361EE]'
                        }`}
                      />
                      {errors.option1 && (
                        <p className="mt-1 text-xs text-red-500 font-semibold">{errors.option1.message}</p>
                      )}
                    </div>

                    {/* Option 2 */}
                    <div>
                      <label htmlFor="option2" className="block text-xs font-bold text-gray-600 mb-2">
                        Option 2 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="option2"
                        type="text"
                        placeholder="Option 2 content"
                        {...register('option2')}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                          errors.option2 ? 'border-red-500' : 'border-[#E2E8F0] focus:border-[#4361EE]'
                        }`}
                      />
                      {errors.option2 && (
                        <p className="mt-1 text-xs text-red-500 font-semibold">{errors.option2.message}</p>
                      )}
                    </div>

                    {/* Option 3 */}
                    <div>
                      <label htmlFor="option3" className="block text-xs font-bold text-gray-600 mb-2">
                        Option 3 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="option3"
                        type="text"
                        placeholder="Option 3 content"
                        {...register('option3')}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                          errors.option3 ? 'border-red-500' : 'border-[#E2E8F0] focus:border-[#4361EE]'
                        }`}
                      />
                      {errors.option3 && (
                        <p className="mt-1 text-xs text-red-500 font-semibold">{errors.option3.message}</p>
                      )}
                    </div>

                    {/* Option 4 */}
                    <div>
                      <label htmlFor="option4" className="block text-xs font-bold text-gray-600 mb-2">
                        Option 4 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="option4"
                        type="text"
                        placeholder="Option 4 content"
                        {...register('option4')}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                          errors.option4 ? 'border-red-500' : 'border-[#E2E8F0] focus:border-[#4361EE]'
                        }`}
                      />
                      {errors.option4 && (
                        <p className="mt-1 text-xs text-red-500 font-semibold">{errors.option4.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Correct Option Selector */}
                  <div>
                    <label className="block text-sm font-bold text-[#1E2139] mb-3">
                      Correct Option Selection <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { id: 'option1', label: 'Option 1' },
                        { id: 'option2', label: 'Option 2' },
                        { id: 'option3', label: 'Option 3' },
                        { id: 'option4', label: 'Option 4' },
                      ].map((opt) => {
                        const isSelected = watchedCorrectOption === opt.id
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center justify-center p-3 rounded-lg border text-sm font-bold cursor-pointer select-none transition-all duration-200 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                : 'border-[#E2E8F0] bg-white text-gray-500 hover:border-gray-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <input
                              type="radio"
                              value={opt.id}
                              {...register('correct_option')}
                              className="sr-only"
                            />
                            <span>{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                    {errors.correct_option && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                        <AlertCircle size={12} /> {errors.correct_option.message}
                      </p>
                    )}
                  </div>

                  {/* Explanation Text */}
                  <div>
                    <label htmlFor="explanation" className="block text-sm font-bold text-[#1E2139] mb-2">
                      Explanation <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="explanation"
                      placeholder="Add an explanation for correct answer..."
                      rows={2}
                      {...register('explanation')}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] resize-none"
                    />
                  </div>

                  {/* Difficulty, Topic, Sub Topic Cascade */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Difficulty */}
                    <div>
                      <label htmlFor="difficulty" className="block text-sm font-bold text-[#1E2139] mb-2">
                        Difficulty
                      </label>
                      <div className="relative">
                        <select
                          id="difficulty"
                          {...register('difficulty')}
                          className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] appearance-none pr-10"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Topic */}
                    <div>
                      <label htmlFor="topic" className="block text-sm font-bold text-[#1E2139] mb-2">
                        Topic
                      </label>
                      <div className="relative">
                        <select
                          id="topic"
                          disabled={isTopicsLoading}
                          {...topicReg}
                          onChange={(e) => {
                            onTopicChange(e)
                            setValue('subTopic', '')
                            setSubTopics([])
                          }}
                          className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] appearance-none pr-10 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Topic</option>
                          {topics.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Sub Topic */}
                    <div>
                      <label htmlFor="subTopic" className="block text-sm font-bold text-[#1E2139] mb-2">
                        Sub Topic
                      </label>
                      <div className="relative">
                        <select
                          id="subTopic"
                          disabled={!watchedTopic || isSubTopicsLoading}
                          {...register('subTopic')}
                          className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] appearance-none pr-10 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {isSubTopicsLoading ? 'Loading subtopics...' : watchedTopic ? 'Select Sub Topic' : 'Select Topic first'}
                          </option>
                          {subTopics.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submission Error Banner */}
                  {pageError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-sm font-semibold flex items-center gap-2">
                      <AlertCircle size={18} />
                      <span>{pageError}</span>
                    </div>
                  )}

                  {/* Form Submission Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#E2E8F0] gap-4">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#1E2139] hover:bg-[#1E2139]/90 text-white rounded-lg font-bold text-sm shadow-sm transition duration-200 cursor-pointer"
                    >
                      {editingIndex !== null ? 'Update Question' : 'Add Question'}
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition duration-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingAll}
                        onClick={handleSaveAndContinue}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4361EE] hover:bg-[#304FF5] text-white rounded-lg font-bold text-sm shadow-md shadow-[#4361EE]/20 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingAll ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            Saving...
                          </>
                        ) : (
                          'Save & Continue'
                        )}
                      </button>
                    </div>
                  </div>

                </form>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AddQuestions