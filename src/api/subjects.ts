import { apiClient } from './auth'
import { mockSubjects, mockTopics, mockSubTopics } from '../mock/data'

const USE_MOCK = true

export const getSubjects = async () => {
  if (USE_MOCK) return { success: true, data: mockSubjects }
  const response = await apiClient.get('/subjects')
  return response.data
}

export const getTopicsBySubject = async (subjectId: string) => {
  if (USE_MOCK) {
    const filtered = mockTopics.filter(t => t.subject_id === subjectId)
    return { success: true, data: filtered }
  }
  const response = await apiClient.get(`/topics/subject/${subjectId}`)
  return response.data
}

export const getSubTopicsByTopics = async (topicIds: string[]) => {
  if (USE_MOCK) {
    const filtered = mockSubTopics.filter(st => topicIds.includes(st.topic_id))
    return { success: true, data: filtered }
  }
  const response = await apiClient.post('/sub-topics/multi-topics', { topicIds })
  return response.data
}