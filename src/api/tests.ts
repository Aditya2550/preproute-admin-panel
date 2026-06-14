import { apiClient } from './auth'
import { mockTests } from '../mock/data'
import type { Test } from '../types'

const USE_MOCK = true

let mockTestsData = [...mockTests]

export const getAllTests = async () => {
  if (USE_MOCK) return { success: true, data: mockTestsData }
  const response = await apiClient.get('/tests')
  return response.data
}

export const getTestById = async (id: string) => {
  if (USE_MOCK) {
    const test = mockTestsData.find(t => t.id === id)
    return { success: true, data: test }
  }
  const response = await apiClient.get(`/tests/${id}`)
  return response.data
}

export const createTest = async (testData: Partial<Test>) => {
  if (USE_MOCK) {
    const newTest: Test = {
      id: `test${Date.now()}`,
      name: testData.name || '',
      type: testData.type || 'chapterwise',
      subject: testData.subject || '',
      topics: testData.topics || [],
      status: null,
      created_at: new Date().toISOString(),
      correct_marks: testData.correct_marks || 4,
      wrong_marks: testData.wrong_marks || -1,
      unattempt_marks: testData.unattempt_marks || 0,
      difficulty: testData.difficulty || 'medium',
      total_time: testData.total_time || 60,
      total_marks: testData.total_marks || 100,
      total_questions: testData.total_questions || 25,
      questions: [],
    }
    mockTestsData.push(newTest)
    return { success: true, data: newTest }
  }
  const response = await apiClient.post('/tests', testData)
  return response.data
}

export const updateTest = async (id: string, testData: Partial<Test>) => {
  if (USE_MOCK) {
    mockTestsData = mockTestsData.map(t => t.id === id ? { ...t, ...testData } : t)
    const updated = mockTestsData.find(t => t.id === id)
    return { success: true, data: updated }
  }
  const response = await apiClient.put(`/tests/${id}`, testData)
  return response.data
}

export const deleteTest = async (id: string) => {
  if (USE_MOCK) {
    mockTestsData = mockTestsData.filter(t => t.id !== id)
    return { success: true, message: 'Test deleted' }
  }
  const response = await apiClient.delete(`/tests/${id}`)
  return response.data
}

export const publishTest = async (id: string) => {
  return updateTest(id, { status: 'live' })
}