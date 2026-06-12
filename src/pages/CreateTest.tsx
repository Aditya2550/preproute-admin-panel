import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, ChevronRight } from 'lucide-react'

import { getSubjects, getTopicsBySubject, getSubTopicsByTopics } from '../api/subjects'
import { createTest, getTestById, updateTest } from '../api/tests'
import { useTest } from '../context/TestContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import type { Subject, Topic, SubTopic, Test } from '../types'

// Zod Validation Schema
const testSchema = z.object({
  name: z.string().min(1, 'Name of Test is required'),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  subTopic: z.string().optional(),
  total_time: z.number().min(1, 'Duration must be at least 1 minute'),
  difficulty: z.enum(['easy', 'medium', 'difficult']),
  correct_marks: z.number(),
  wrong_marks: z.number(),
  unattempt_marks: z.number(),
  total_questions: z.number().min(1, 'Number of questions must be at least 1'),
  total_marks: z.number().min(1, 'Total marks must be at least 1'),
})

type TestFormValues = z.infer<typeof testSchema>

const CreateTest = () => {
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id
  const navigate = useNavigate()
  const { setCurrentTest } = useTest()

  // Component States
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subTopics, setSubTopics] = useState<SubTopic[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isTopicsLoading, setIsTopicsLoading] = useState(false)
  const [isSubTopicsLoading, setIsSubTopicsLoading] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'chapterwise' | 'pyq' | 'mock'>('chapterwise')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React Hook Form Configuration
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      subject: '',
      topic: '',
      subTopic: '',
      total_time: 60,
      difficulty: 'medium',
      correct_marks: 5,
      wrong_marks: -1,
      unattempt_marks: 0,
      total_questions: 25,
      total_marks: 100,
    },
  })

  // Watchers for cascading dropdowns
  const watchedSubject = watch('subject')
  const watchedTopic = watch('topic')

  // Register adjustments to clear child dropdowns on parent changes
  const { onChange: onSubjectChange, ...subjectReg } = register('subject')
  const { onChange: onTopicChange, ...topicReg } = register('topic')

  // Initialize data (Subjects + Test details if in Edit Mode)
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // 1. Fetch subjects first
        const subRes = await getSubjects()
        if (!subRes.success || !subRes.data) {
          throw new Error('Failed to load subjects')
        }
        setSubjects(subRes.data)

        if (isEditMode && id) {
          // 2. Fetch test details
          const testRes = await getTestById(id)
          if (!testRes.success || !testRes.data) {
            throw new Error('Failed to load test details')
          }
          const test: Test = testRes.data

          // 3. Match subject name to get subjectId
          const matchedSubject = subRes.data.find(
            (s: Subject) => s.name.toLowerCase() === test.subject.toLowerCase()
          )
          const subjectId = matchedSubject ? matchedSubject.id : ''

          let topicId = ''
          let fetchedTopics: Topic[] = []
          if (subjectId) {
            // 4. Fetch topics for that subjectId
            const topicRes = await getTopicsBySubject(subjectId)
            if (topicRes.success && topicRes.data) {
              fetchedTopics = topicRes.data
              setTopics(fetchedTopics)
              
              // 5. Match topic name (test.topics[0]) to get topicId
              if (test.topics && test.topics.length > 0) {
                const matchedTopic = fetchedTopics.find(
                  (t: Topic) => t.name.toLowerCase() === test.topics[0].toLowerCase()
                )
                topicId = matchedTopic ? matchedTopic.id : ''
              }
            }
          }

          let fetchedSubTopics: SubTopic[] = []
          if (topicId) {
            // 6. Fetch subtopics for that topicId
            const subTopicRes = await getSubTopicsByTopics([topicId])
            if (subTopicRes.success && subTopicRes.data) {
              fetchedSubTopics = subTopicRes.data
              setSubTopics(fetchedSubTopics)
            }
          }

          // Set active tab
          if (test.type === 'chapterwise' || test.type === 'pyq' || test.type === 'mock') {
            setActiveTab(test.type)
          }

          // 7. Pre-fill the form values
          reset({
            name: test.name,
            subject: subjectId,
            topic: topicId,
            subTopic: '', // Sub-topic is not model-defined in Test type, default to empty
            total_time: test.total_time,
            difficulty: (test.difficulty?.toLowerCase() as 'easy' | 'medium' | 'difficult') || 'medium',
            correct_marks: test.correct_marks,
            wrong_marks: test.wrong_marks,
            unattempt_marks: test.unattempt_marks,
            total_questions: test.total_questions,
            total_marks: test.total_marks,
          })
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'An error occurred while loading form data.')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [id, isEditMode, reset])

  // Cascading dropdown fetch logic for Subject change
  useEffect(() => {
    // Only run if form is loaded and watchedSubject is set
    if (watchedSubject && !isLoading) {
      const fetchTopics = async () => {
        setIsTopicsLoading(true)
        try {
          const res = await getTopicsBySubject(watchedSubject)
          if (res.success && res.data) {
            setTopics(res.data)
          } else {
            setTopics([])
          }
        } catch (err) {
          console.error(err)
          setTopics([])
        } finally {
          setIsTopicsLoading(false)
        }
      }
      fetchTopics()
    }
  }, [watchedSubject, isLoading])

  // Cascading dropdown fetch logic for Topic change
  useEffect(() => {
    // Only run if form is loaded and watchedTopic is set
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
    }
  }, [watchedTopic, isLoading])

  // Handle Form Submission
  const onSubmit = async (data: TestFormValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Find subject name by ID
      const subjectObj = subjects.find((s) => s.id === data.subject)
      const subjectName = subjectObj ? subjectObj.name : ''

      // Find topic name by ID
      const topicObj = topics.find((t) => t.id === data.topic)
      const topicName = topicObj ? topicObj.name : ''

      const payload: Partial<Test> = {
        name: data.name,
        type: activeTab,
        subject: subjectName,
        topics: topicName ? [topicName] : [],
        difficulty: data.difficulty,
        total_time: data.total_time,
        correct_marks: data.correct_marks,
        wrong_marks: data.wrong_marks,
        unattempt_marks: data.unattempt_marks,
        total_questions: data.total_questions,
        total_marks: data.total_marks,
      }

      let response
      if (isEditMode && id) {
        response = await updateTest(id, payload)
      } else {
        response = await createTest(payload)
      }

      if (response.success && response.data) {
        setCurrentTest(response.data)
        navigate(`/add-questions/${response.data.id}`)
      } else {
        throw new Error(response.message || 'Failed to save the test.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while saving the test.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#1E2139] font-sans">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Navbar */}
        <Navbar title="Test Creation" />

        {/* Inner Main Content Pane */}
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {/* Breadcrumb navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
            <span>Test Creation</span>
            <ChevronRight size={14} className="text-gray-400" />
            <span>Create Test</span>
            <ChevronRight size={14} className="text-gray-400" />
            <span className="text-[#4361EE] capitalize">
              {activeTab === 'chapterwise' ? 'Chapter Wise' : activeTab === 'pyq' ? 'PYQ' : 'Mock Test'}
            </span>
          </div>

          {/* Page Heading Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1E2139]">
              {isEditMode ? 'Edit Test Paper' : 'Create New Test'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode
                ? 'Modify settings, marking schemes, and configurations for this existing paper.'
                : 'Configure subjects, timing details, difficult levels, and marks to set up your test.'}
            </p>
          </div>

          {/* Loading State for Edit/Prefill mode */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#4361EE]" size={40} />
              <span className="text-sm font-semibold text-gray-500">Loading configurations...</span>
            </div>
          ) : (
            <div className="max-w-4xl">
              {/* Type Selection Tabs */}
              <div className="flex border-b border-[#E2E8F0] mb-8 gap-8">
                {[
                  { id: 'chapterwise', label: 'Chapter Wise' },
                  { id: 'pyq', label: 'PYQ' },
                  { id: 'mock', label: 'Mock Test' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 'chapterwise' | 'pyq' | 'mock')}
                    className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[#4361EE] text-[#4361EE]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name of Test */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-[#1E2139] mb-2">
                      Name of Test <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g. Algebra Fundamentals Test"
                      {...register('name')}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                        errors.name
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#E2E8F0] focus:border-[#4361EE]'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                        <AlertCircle size={12} /> {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Subject, Topic, Sub Topic Cascade */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-bold text-[#1E2139] mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          {...subjectReg}
                          onChange={(e) => {
                            onSubjectChange(e)
                            setValue('topic', '')
                            setValue('subTopic', '')
                            setTopics([])
                            setSubTopics([])
                          }}
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 appearance-none pr-10 ${
                            errors.subject
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[#E2E8F0] focus:border-[#4361EE]'
                          }`}
                        >
                          <option value="">Select Subject</option>
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                      {errors.subject && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                          <AlertCircle size={12} /> {errors.subject.message}
                        </p>
                      )}
                    </div>

                    {/* Topic */}
                    <div>
                      <label htmlFor="topic" className="block text-sm font-bold text-[#1E2139] mb-2">
                        Topic <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="topic"
                          disabled={!watchedSubject || isTopicsLoading}
                          {...topicReg}
                          onChange={(e) => {
                            onTopicChange(e)
                            setValue('subTopic', '')
                            setSubTopics([])
                          }}
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 appearance-none pr-10 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                            errors.topic
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[#E2E8F0] focus:border-[#4361EE]'
                          }`}
                        >
                          <option value="">
                            {isTopicsLoading ? 'Loading topics...' : watchedSubject ? 'Select Topic' : 'Select Subject first'}
                          </option>
                          {topics.map((top) => (
                            <option key={top.id} value={top.id}>
                              {top.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                      {errors.topic && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                          <AlertCircle size={12} /> {errors.topic.message}
                        </p>
                      )}
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
                            {isSubTopicsLoading ? 'Loading sub-topics...' : watchedTopic ? 'Select Sub Topic' : 'Select Topic first'}
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

                  {/* Duration & Difficulty */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Duration in Minutes */}
                    <div>
                      <label htmlFor="total_time" className="block text-sm font-bold text-[#1E2139] mb-2">
                        Duration in Minutes <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="total_time"
                        type="number"
                        placeholder="e.g. 60"
                        {...register('total_time', { valueAsNumber: true })}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                          errors.total_time
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E2E8F0] focus:border-[#4361EE]'
                        }`}
                      />
                      {errors.total_time && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                          <AlertCircle size={12} /> {errors.total_time.message}
                        </p>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-bold text-[#1E2139] mb-3">
                        Test Difficulty Level
                      </label>
                      <div className="flex items-center gap-6 mt-2">
                        {[
                          { value: 'easy', label: 'Easy' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'difficult', label: 'Difficult' },
                        ].map((diff) => (
                          <label key={diff.value} className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                            <input
                              type="radio"
                              value={diff.value}
                              {...register('difficulty')}
                              className="w-4 h-4 text-[#4361EE] focus:ring-[#4361EE]/20 border-gray-300 cursor-pointer"
                            />
                            <span>{diff.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Marking Scheme */}
                  <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-6">
                    <h3 className="text-sm font-bold text-[#1E2139] mb-4 uppercase tracking-wider">
                      Marking Scheme Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Correct Answer */}
                      <div>
                        <label htmlFor="correct_marks" className="block text-xs font-bold text-gray-600 mb-2">
                          Correct Answer Mark
                        </label>
                        <input
                          id="correct_marks"
                          type="number"
                          step="any"
                          {...register('correct_marks', { valueAsNumber: true })}
                          className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                            errors.correct_marks ? 'border-red-500' : 'border-[#E2E8F0] focus:border-[#4361EE]'
                          }`}
                        />
                        {errors.correct_marks && (
                          <p className="mt-1 text-xs text-red-500 font-semibold">{errors.correct_marks.message}</p>
                        )}
                      </div>

                      {/* Wrong Answer */}
                      <div>
                        <label htmlFor="wrong_marks" className="block text-xs font-bold text-gray-600 mb-2">
                          Wrong Answer Mark
                        </label>
                        <input
                          id="wrong_marks"
                          type="number"
                          step="any"
                          {...register('wrong_marks', { valueAsNumber: true })}
                          className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                            errors.wrong_marks ? 'border-red-500' : 'border-[#E2E8F0] focus:border-[#4361EE]'
                          }`}
                        />
                        {errors.wrong_marks && (
                          <p className="mt-1 text-xs text-red-500 font-semibold">{errors.wrong_marks.message}</p>
                        )}
                      </div>

                      {/* Unattempted */}
                      <div>
                        <label htmlFor="unattempt_marks" className="block text-xs font-bold text-gray-600 mb-2">
                          Unattempted Answer Mark
                        </label>
                        <input
                          id="unattempt_marks"
                          type="number"
                          step="any"
                          {...register('unattempt_marks', { valueAsNumber: true })}
                          className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                            errors.unattempt_marks ? 'border-red-500' : 'border-[#E2E8F0] focus:border-[#4361EE]'
                          }`}
                        />
                        {errors.unattempt_marks && (
                          <p className="mt-1 text-xs text-red-500 font-semibold">{errors.unattempt_marks.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Questions & Marks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* No of Questions */}
                    <div>
                      <label htmlFor="total_questions" className="block text-sm font-bold text-[#1E2139] mb-2">
                        No of Questions <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="total_questions"
                        type="number"
                        placeholder="e.g. 25"
                        {...register('total_questions', { valueAsNumber: true })}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                          errors.total_questions
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E2E8F0] focus:border-[#4361EE]'
                        }`}
                      />
                      {errors.total_questions && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                          <AlertCircle size={12} /> {errors.total_questions.message}
                        </p>
                      )}
                    </div>

                    {/* Total Marks */}
                    <div>
                      <label htmlFor="total_marks" className="block text-sm font-bold text-[#1E2139] mb-2">
                        Total Marks <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="total_marks"
                        type="number"
                        placeholder="e.g. 100"
                        {...register('total_marks', { valueAsNumber: true })}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 ${
                          errors.total_marks
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E2E8F0] focus:border-[#4361EE]'
                        }`}
                      />
                      {errors.total_marks && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-semibold">
                          <AlertCircle size={12} /> {errors.total_marks.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submission Error Banner */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-sm font-semibold flex items-center gap-2">
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4361EE] hover:bg-[#304FF5] text-white rounded-lg font-bold text-sm shadow-md shadow-[#4361EE]/20 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        'Next'
                      )}
                    </button>
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

export default CreateTest