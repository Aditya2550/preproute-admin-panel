import { apiClient } from './auth'
import type { Question } from '../types'

const USE_MOCK = false

const mockQuestionsData: Question[] = []

export const bulkCreateQuestions = async (questions: Question[]) => {
  if (USE_MOCK) {
    const created = questions.map((q, i) => ({
      ...q,
      id: `q${Date.now()}${i}`,
    }))
    mockQuestionsData.push(...created)
    return { success: true, data: created }
  }
  const response = await apiClient.post('/questions/bulk', { questions })
  return response.data
}

export const fetchBulkQuestions = async (question_ids: string[]) => {
  if (USE_MOCK) {
    const filtered = mockQuestionsData.filter(q => question_ids.includes(q.id || ''))
    return { success: true, data: filtered }
  }
  const response = await apiClient.post('/questions/fetchBulk', { question_ids })
  return response.data
}