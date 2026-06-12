export interface User {
  id: string
  userId: string
  role: string
}

export interface Subject {
  id: string
  name: string
}

export interface Topic {
  id: string
  name: string
  subject_id: string
}

export interface SubTopic {
  id: string
  name: string
  topic_id: string
}

export interface Test {
  id: string
  name: string
  type: string
  subject: string
  topics: string[]
  status: 'draft' | 'live' | null
  created_at: string
  correct_marks: number
  wrong_marks: number
  unattempt_marks: number
  difficulty: string
  total_time: number
  total_marks: number
  total_questions: number
  questions?: string[]
}

export interface Question {
  id?: string
  type: 'mcq'
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: string
  explanation?: string
  difficulty?: string
  test_id: string
  topic_id?: string
  sub_topic_id?: string
}