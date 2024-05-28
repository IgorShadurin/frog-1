import { Quiz, QuizStructure, Question } from '../api/quiz/index.ts'

function generateQuestion(correctAnswerIndex: number): Question {
  const numAnswers = Quiz.expectedAnswersCount
  const question: Question = {
    question: 'Random question?',
    answers: [],
    correctAnswerIndex: correctAnswerIndex,
  }

  // Generate random answers
  for (let i = 0; i < numAnswers; i++) {
    question.answers.push(`Answer ${i + 1}`)
  }

  return question
}

describe('Quiz', () => {
  let quizStructure: QuizStructure

  beforeEach(() => {
    quizStructure = {
      questions: [
        generateQuestion(2), // Correct answer at index 2
        generateQuestion(1), // Correct answer at index 1
      ],
    }
  })

  it('should validate quiz structure', () => {
    expect(Quiz.validateQuizStructure(quizStructure)).toBe(true)
  })

  it('should start the quiz', () => {
    const quiz = new Quiz(quizStructure)
    const firstQuestion = quiz.start()
    expect(firstQuestion.question).toBe('Random question?')
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

  // New Test Cases
  it('should return false for invalid quiz structure', () => {
    const invalidQuizStructure: QuizStructure = {
      questions: [
        generateQuestion(1), // Correct answer at index 1
      ],
    }
    invalidQuizStructure.questions[0].answers.pop() // make the number of answers less than expected
    expect(Quiz.validateQuizStructure(invalidQuizStructure)).toBe(false)
  })

  it('should throw error for invalid quiz structure on instantiation', () => {
    const invalidQuizStructure: QuizStructure = {
      questions: [
        generateQuestion(1), // Correct answer at index 1
      ],
    }
    invalidQuizStructure.questions[0].answers.pop() // make the number of answers less than expected
    expect(() => new Quiz(invalidQuizStructure)).toThrow('Invalid quiz structure')
  })

  it('should handle empty quiz structure', () => {
    const emptyQuizStructure: QuizStructure = { questions: [] }
    expect(() => new Quiz(emptyQuizStructure)).toThrow('Invalid quiz structure')
  })

  it('should not accept answer index out of bounds', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    expect(quiz.check(10)).toBe(false)
  })

  it('should not move to next question if last question', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.next()
    expect(quiz.next()).toBe(false)
  })

  it('should return zero points if no questions answered', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    expect(quiz.result()).toBe(0)
  })

  it('should return correct points for all correct answers', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.check(2)
    quiz.next()
    quiz.check(1)
    expect(quiz.result()).toBe(4)
  })

  it('should return correct points for all incorrect answers', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.check(0)
    quiz.next()
    quiz.check(0)
    expect(quiz.result()).toBe(-2)
  })

  it('should reset points on start', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.check(2)
    quiz.start()
    expect(quiz.result()).toBe(0)
  })

  it('should reset current question on start', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.next()
    quiz.start()
    expect(quiz.check(2)).toBe(true)
  })

  it('should handle mixed correct and incorrect answers', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.check(2)
    quiz.next()
    quiz.check(0)
    expect(quiz.result()).toBe(1)
  })

  it('should validate correctAnswerIndex is within bounds', () => {
    const invalidQuizStructure: QuizStructure = {
      questions: [
        {
          question: 'Invalid question?',
          answers: ['A', 'B', 'C'],
          correctAnswerIndex: 3,
        },
      ],
    }
    expect(Quiz.validateQuizStructure(invalidQuizStructure)).toBe(false)
  })

  it('should return false for incorrect answer on the second question', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.next()
    expect(quiz.check(0)).toBe(false)
  })

  it('should not add points for unanswered question', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    quiz.next()
    expect(quiz.result()).toBe(0)
  })

  it('should handle questions with the same answers', () => {
    const sameAnswersQuizStructure: QuizStructure = {
      questions: [
        {
          question: 'Which one?',
          answers: ['A', 'A', 'A'],
          correctAnswerIndex: 1,
        },
      ],
    }
    const quiz = new Quiz(sameAnswersQuizStructure)
    quiz.start()
    expect(quiz.check(1)).toBe(true)
  })

  it('should handle negative answer index', () => {
    const quiz = new Quiz(quizStructure)
    quiz.start()
    expect(quiz.check(-1)).toBe(false)
  })

  it('should return false for check if no current question', () => {
    const quiz = new Quiz(quizStructure)
    expect(quiz.check(0)).toBe(false)
  })

  it('should handle quiz with maximum points', () => {
    const maxPointsQuizStructure: QuizStructure = {
      questions: [
        generateQuestion(0),
        generateQuestion(1),
        generateQuestion(2),
        generateQuestion(1),
      ],
    }
    const quiz = new Quiz(maxPointsQuizStructure)
    quiz.start()
    quiz.check(0)
    quiz.next()
    quiz.check(1)
    quiz.next()
    quiz.check(2)
    quiz.next()
    quiz.check(1)
    expect(quiz.result()).toBe(8)
  })
})
