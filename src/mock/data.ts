import type { Subject, Topic, SubTopic, Test } from '../types'

export const mockSubjects: Subject[] = [
  { id: 's1', name: 'Mathematics' },
  { id: 's2', name: 'Physics' },
  { id: 's3', name: 'Chemistry' },
]

export const mockTopics: Topic[] = [
  { id: 't1', name: 'Algebra', subject_id: 's1' },
  { id: 't2', name: 'Calculus', subject_id: 's1' },
  { id: 't3', name: 'Mechanics', subject_id: 's2' },
  { id: 't4', name: 'Thermodynamics', subject_id: 's2' },
  { id: 't5', name: 'Organic Chemistry', subject_id: 's3' },
]

export const mockSubTopics: SubTopic[] = [
  { id: 'st1', name: 'Linear Equations', topic_id: 't1' },
  { id: 'st2', name: 'Quadratic Equations', topic_id: 't1' },
  { id: 'st3', name: 'Differentiation', topic_id: 't2' },
  { id: 'st4', name: 'Newtons Laws', topic_id: 't3' },
  { id: 'st5', name: 'Hydrocarbons', topic_id: 't5' },
]

export const mockTests: Test[] = [
  {
    id: 'test1',
    name: 'Mathematics Chapter Test',
    type: 'chapterwise',
    subject: 'Mathematics',
    topics: ['Algebra'],
    status: 'draft',
    created_at: '2026-01-15T10:00:00Z',
    correct_marks: 4,
    wrong_marks: -1,
    unattempt_marks: 0,
    difficulty: 'medium',
    total_time: 60,
    total_marks: 100,
    total_questions: 25,
    questions: [],
  },
  {
    id: 'test2',
    name: 'Physics Mock Test',
    type: 'mock',
    subject: 'Physics',
    topics: ['Mechanics'],
    status: 'live',
    created_at: '2026-02-20T10:00:00Z',
    correct_marks: 4,
    wrong_marks: -1,
    unattempt_marks: 0,
    difficulty: 'hard',
    total_time: 180,
    total_marks: 360,
    total_questions: 90,
    questions: [],
  },
]