import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Test, Question } from '../types'

interface TestContextType {
  currentTest: Test | null
  setCurrentTest: (test: Test | null) => void
  questions: Question[]
  setQuestions: (questions: Question[]) => void
  resetTest: () => void
}

const TestContext = createContext<TestContextType | null>(null)

export const TestProvider = ({ children }: { children: ReactNode }) => {
  const [currentTest, setCurrentTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  const resetTest = () => {
    setCurrentTest(null)
    setQuestions([])
  }

  return (
    <TestContext.Provider value={{
      currentTest,
      setCurrentTest,
      questions,
      setQuestions,
      resetTest,
    }}>
      {children}
    </TestContext.Provider>
  )
}

export const useTest = () => {
  const context = useContext(TestContext)
  if (!context) throw new Error('useTest must be used within TestProvider')
  return context
}