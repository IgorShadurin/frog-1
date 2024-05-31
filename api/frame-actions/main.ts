import { configureApp } from '../utils/frame.js'
import { Button, FrameContext } from 'frog'
import { BORDER_SIMPLE, Box, Heading, Text, VStack } from '../utils/style.js'
import quizData from '../../quiz.json'
import { app } from '../index.js'

export default async (c: FrameContext) => {
  const { appTitle } = await configureApp(app, c, 'appAuthUrl')

  const intents = [<Button action="/next">⭐ Start</Button>]

  return c.res({
    title: appTitle,
    image: (
      <Box grow alignVertical="center" backgroundColor="white" padding="32" border={BORDER_SIMPLE}>
        <VStack gap="4">
          <Heading color="h1Text" align="center" size="64">
            Quiz time!
          </Heading>

          <Text align="center" size="18">
            {quizData.shortDescription}
          </Text>
        </VStack>
      </Box>
    ),
    intents,
  })
}
