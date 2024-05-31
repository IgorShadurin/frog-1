import { configureApp } from '../utils/frame.js'
import { Quiz } from '../quiz/index.js'
import quizData from '../../quiz.json'
import { Button, FrameContext } from 'frog'
import { BORDER_SIMPLE, Box, Heading, Text, VStack } from '../utils/style.js'
import { app } from '../index.js'

export default async (c: FrameContext) => {
  const { appTitle, appShareUrl } = await configureApp(app, c)
  const buttonData = JSON.parse(c.buttonValue || '{}')
  const questionIndex = buttonData.qi ? Number(buttonData.qi) : 0
  const points = buttonData.p ? Number(buttonData.p) : 0
  const quiz = new Quiz(quizData, questionIndex, points)
  const isLastQuestion = questionIndex >= quiz.questions.length - 1
  const action = isLastQuestion ? '/result' : '/next'
  const answers = quiz.questions[questionIndex].answers.map((item, index) => ({
    text: item,
    index,
  }))
  const shuffled = answers.sort(() => Math.random() - 0.5)
  const intents = await Promise.all([
    ...shuffled.map(async item => {
      const newPoints = quiz.check(item.index).points
      const value = JSON.stringify({ qi: questionIndex + 1, p: newPoints })

      return (
        <Button value={value} action={action}>
          {item.text}
        </Button>
      )
    }),
    <Button.Link href={appShareUrl}>🔗 Share</Button.Link>,
  ])

  return c.res({
    title: appTitle,
    image: (
      <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER_SIMPLE}>
        <VStack gap="4">
          <Heading color="h1Text" align="center" size="64">
            {quiz.questions[questionIndex].question}
          </Heading>
          <Text align="center" size="18">
            Question: {questionIndex + 1}/{quiz.questions.length}
          </Text>
        </VStack>
      </Box>
    ),
    intents,
  })
}
