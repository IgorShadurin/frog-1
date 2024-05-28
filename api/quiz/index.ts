export interface Question {
  question: string
  answers: string[]
  correctAnswerIndex: number
}

export interface QuizStructure {
  questions: Question[]
}

export class Quiz {
  private questions: Question[]
  private currentQuestionIndex: number = 0
  private points: number = 0
  public static readonly expectedAnswersCount: number = 3

  constructor(quizStructure: QuizStructure) {
    if (!Quiz.validateQuizStructure(quizStructure)) {
      throw new Error('Invalid quiz structure')
    }
    this.questions = quizStructure.questions
  }

  /**
   * Validate the structure of the quiz.
   * @param quizStructure - The quiz structure to validate.
   * @returns Whether the quiz structure is valid.
   */
  static validateQuizStructure(quizStructure: QuizStructure): boolean {
    if (!quizStructure.questions || quizStructure.questions.length === 0) {
      return false
    }

    for (const question of quizStructure.questions) {
      if (
        question.answers.length !== Quiz.expectedAnswersCount ||
        question.correctAnswerIndex < 0 ||
        question.correctAnswerIndex >= Quiz.expectedAnswersCount
      ) {
        return false
      }
    }

    return true
  }

  /**
   * Start the quiz by resetting points and setting the first question as current.
   * @returns The first question.
   */
  start(): Question {
    this.currentQuestionIndex = 0
    this.points = 0

    return this.questions[this.currentQuestionIndex]
  }

  /**
   * Check the answer for the current question.
   * @param answerId - The index of the selected answer.
   * @returns Whether the answer is correct.
   */
  check(answerId: number): boolean {
    const isCorrect = this.questions[this.currentQuestionIndex].correctAnswerIndex === answerId
    this.points += isCorrect ? 2 : -1

    return isCorrect
  }

  /**
   * Move to the next question if available.
   * @returns Whether there is a next question.
   */
  next(): boolean {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++

      return true
    }

    return false
  }

  /**
   * Get the result of the quiz.
   * @returns The total points.
   */
  result(): number {
    return this.points
  }
}
