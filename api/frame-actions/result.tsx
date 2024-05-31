import { configureApp } from '../utils/frame.js'
import { Quiz } from '../quiz/index.js'
import quizData from '../../quiz.json'
import { kvGetDelegatedAddress } from '../utils/kv.js'
import { Button, FrameContext } from 'frog'
import { BORDER_FAIL, BORDER_SUCCESS, Box, Heading, Text, VStack } from '../utils/style.js'
import { app } from '../index.js'

export default async (c: FrameContext) => {
  const { appTitle, userMainAddress } = await configureApp(app, c)
  const buttonData = JSON.parse(c.buttonValue || '{}')
  const quiz = new Quiz(quizData)
  const points = buttonData.p ? Number(buttonData.p) : 0
  const pointsText = `${points.toString()} of ${quiz.questions.length}`
  const isWin = points === quiz.questions.length
  const resultText = isWin ? "That's right! Well done!" : 'You can do better!'
  const userDelegatedAddress = await kvGetDelegatedAddress(userMainAddress)
  const intents = [<Button action="/">🔁 Again</Button>]

  if (!isWin) {
    // if user authorized direct to answers, if not direct to authorize
    intents.push(<Button action={userDelegatedAddress ? '/answers' : '/authorize'}>🙋 Answers</Button>)
  }

  intents.push(<Button.Link href="https://hack.dappykit.org/?source=quiz-template">🔴 Win Tokens</Button.Link>)

  return c.res({
    title: appTitle,
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border={isWin ? BORDER_SUCCESS : BORDER_FAIL}
      >
        <VStack gap="4">
          <Heading color="h1Text" align="center" size="48">
            {resultText}
          </Heading>
          <Text align="center" size="24">
            Correct answers: {pointsText}
          </Text>
        </VStack>
      </Box>
    ),
    intents,
  })
}
