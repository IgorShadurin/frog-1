import { Quiz, QuizStructure } from '../api/quiz/index.ts'

describe('Quiz', () => {
  let quizStructure: QuizStructure

  beforeEach(() => {
    quizStructure = {
      questions: [
        {
          question: 'What is the capital of France?',
          answers: ['Berlin', 'Madrid', 'Paris', 'Rome'],
          correctAnswerIndex: 2,
        },
        {
          question: 'What is 2 + 2?',
          answers: ['3', '4', '5', '6'],
          correctAnswerIndex: 1,
        },
      ],
    }
  })

  it('should validate quiz structure', () => {
    expect(Quiz.validateQuizStructure(quizStructure)).toBe(true)
  })

  it('should start the quiz', () => {
    const quiz = new Quiz(quizStructure)
    const firstQuestion = quiz.start()
    expect(firstQuestion.question).toBe('What is the capital of France?')
  })

  it('should check correct answer', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    expect(quiz.check(2)).toBe(true) // Correct answer for first question
  })

  it('should check incorrect answer', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    expect(quiz.check(1)).toBe(false) // Incorrect answer for first question
  })

  it('should move to next question', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    expect(quiz.next()).toBe(true)
  })

  it('should return points', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.check(2) // Correct answer
    quiz.next()
    quiz.check(0) // Incorrect answer
    expect(quiz.result()).toBe(1) // +2 -1
  })
})
