import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import dappykit from '@dappykit/sdk'
import {
  kvDeleteDelegatedToPk,
  kvDeleteMainToDelegated, kvDeleteProof,
  kvGetDelegatedAddress,
  kvGetMnemonic,
  kvGetProof,
  kvPutMnemonic
} from './utils/kv.js'
import { configureApp } from './utils/frame.js'
import { cardStyle, textStyle } from './utils/style.js'
import { prepareEthAddress } from './utils/eth.js'
import { handle } from 'frog/vercel'

const {ViemUtils, Utils} = dappykit
const {generateMnemonic, privateKeyToAccount, english, mnemonicToAccount} = ViemUtils
const {accountToSigner} = Utils.Signer

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
})

app.frame('/', async (c) => {
  const {appTitle} = await configureApp(app, c)

  return c.res({
    title: appTitle,
    image: (
        <div style={cardStyle}>
          <div style={textStyle}>
            {'This is an example of DappyKit integration. Click the "Start" button.'}
          </div>
        </div>
    ),
    intents: [
      <Button value="start" action="/start">Start</Button>,
    ],
  })
})

app.frame('/start', async (c) => {
  const {appTitle, userMainAddress, dappyKit, appAddress} = await configureApp(app, c, 'appAuthUrl')
  const isAppExists = await dappyKit.farcasterClient.applicationExists(appAddress)
  const userDelegatedAddress = await kvGetDelegatedAddress(userMainAddress)
  let intents = []
  let text = ''
  if (isAppExists) {
    if (userDelegatedAddress) {
      text = 'The application is authorized! You can manage user information using the buttons below.'
      intents = [
        <Button value="info" action="/info">Info</Button>,
        <Button value="save" action="/save">Save Data</Button>,
        <Button value="reset-delegated" action="/reset-delegated">Reset Delegated Address</Button>,
      ]
    } else {
      text = 'This is an example of DappyKit integration. Click "Auth Request" to authorize the app.'
      intents = [
        <Button value="auth-request" action="/auth-request">Auth Request</Button>,
        <Button.Reset>Back</Button.Reset>,
      ]
    }
  } else {
    text = 'The application is not registered. Please contact the application owner.'
    intents = [
      <Button.Reset>Back</Button.Reset>,
    ]
  }

  return c.res({
    title: appTitle,
    image: (
        <div style={cardStyle}>
          <div style={textStyle}>
            {text}
          </div>
        </div>
    ),
    intents,
  })
})

app.frame('/save', async (c) => {
  const {userMainAddress, dappyKit, appAddress} = await configureApp(app, c)
  let storedData = '---'
  try {
    const delegatedAddress = await kvGetDelegatedAddress(userMainAddress)
    if (delegatedAddress) {
      const mnemonic = await kvGetMnemonic(delegatedAddress)
      const proof = await kvGetProof(delegatedAddress)
      if (mnemonic && proof) {
        storedData = `Data: ${Math.random()}`
        const appSigner = accountToSigner(mnemonicToAccount(mnemonic))
        storedData += JSON.stringify(await dappyKit.farcasterClient.saveUserAppData(userMainAddress, appAddress, storedData, proof, appSigner))
      } else {
        storedData = 'Mnemonic or proof not found.'
      }
    }
  } catch (e) {
    storedData = `Error: ${(e as Error).message}`
  }

  return c.res({
    image: (
        <div style={cardStyle}>
          <div style={textStyle}>
            {`Data stored. ${storedData}`}
          </div>
        </div>
    ),
    intents: [
      <Button.Reset>Back</Button.Reset>
    ],
  })
})

app.frame('/info', async (c) => {
  const {userMainAddress, dappyKit, appAddress} = await configureApp(app, c)

  let userDelegatedAddress = 'Oops'
  let storedData = '---'
  try {
    const delegatedAddress = await kvGetDelegatedAddress(userMainAddress)
    userDelegatedAddress = delegatedAddress || 'No delegated address found.'
    if (delegatedAddress) {
      storedData = await dappyKit.farcasterClient.getDataByAddress(userMainAddress, appAddress)
    }
  } catch (e) {
    userDelegatedAddress = `Error: ${(e as Error).message}`
  }

  return c.res({
    image: (
        <div style={cardStyle}>
          <div style={textStyle}>
            {`Delegated address: 0x${userDelegatedAddress}. Stored data: "${storedData}". Nonce: ${(await dappyKit.farcasterClient.getUserInfo(userMainAddress, appAddress)).nonce}.`}
          </div>
        </div>
    ),
    intents: [
      <Button.Reset>Back</Button.Reset>
    ],
  })
})

app.frame('/auth-request', async (c) => {
  let errorText = ''
  let response
  const {dappyKit, messageBytes, appPk, appAuthUrl} = await configureApp(app, c)

  try {
    const appSigner = accountToSigner(privateKeyToAccount(appPk))
    const userDelegatedMnemonic = generateMnemonic(english)
    const userDelegatedWallet = mnemonicToAccount(userDelegatedMnemonic)
    response = await dappyKit.farcasterClient.createAuthRequest(messageBytes, userDelegatedWallet.address, appSigner)
    if (response.status != 'ok') {
      throw new Error(`Invalid auth response status. ${JSON.stringify(response)}`)
    }

    await kvPutMnemonic(userDelegatedWallet.address, userDelegatedMnemonic)
  } catch (e) {
    console.log('auth request error', (e as Error).message)
    errorText = `Error: ${(e as Error).message}`
  }

  return c.res({
    image: (
        <div style={cardStyle}>
          <div style={textStyle}>
            {errorText && `Error: ${errorText}`}
            {response?.status === 'ok' && `Open the Auth App and choose the answer: ${response.answer}.`}
          </div>
        </div>
    ),
    intents: [
      <Button.Link href={appAuthUrl}>Auth App</Button.Link>,
      <Button.Reset>Back</Button.Reset>
    ],
  })
})

app.frame('/reset-delegated', async (c) => {
  const {userMainAddress} = await configureApp(app, c)
  const userDelegatedAddress = await kvGetDelegatedAddress(userMainAddress)
  if (userDelegatedAddress) {
    await kvDeleteMainToDelegated(prepareEthAddress(userMainAddress))
    await kvDeleteDelegatedToPk(userDelegatedAddress)
    await kvDeleteProof(userDelegatedAddress)
  }

  return c.res({
    image: (
        <div style={cardStyle}>
          <div style={textStyle}>
            {userDelegatedAddress ? `Delegated Address has been reset. You can issue a new address for this application.` : `No delegated address found.`}
          </div>
        </div>
    ),
    intents: [
      <Button.Reset>Back</Button.Reset>
    ],
  })
})

const isCloudflareWorker = typeof caches !== 'undefined'
if (isCloudflareWorker) {
  // @ts-ignore
  const manifest = await import('__STATIC_CONTENT_MANIFEST')
  const serveStaticOptions = {manifest, root: './'}
  app.use('/*', serveStatic(serveStaticOptions))
  devtools(app, {assetsPath: '/frog', serveStatic, serveStaticOptions})
} else {
  devtools(app, {serveStatic})
}

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? {assetsPath: '/.frog'} : {serveStatic})

export const GET = handle(app)
export const POST = handle(app)
