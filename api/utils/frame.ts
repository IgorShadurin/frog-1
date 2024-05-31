import { FrameContext, Frog } from 'frog'
import dappykit from '@dappykit/sdk'
import { clickcasterLog } from './clickcaster.js'

const { Config, SDK } = dappykit

export interface IClickData {
  appTitle: string
  userMainAddress: string
  fid: number
  url: string
  messageBytes: string
  dappyKit: InstanceType<typeof SDK>
  appAddress: string
  appPk: `0x${string}`
  appAuthUrl: string
  appShareUrl: string
}

export function addMetaTags(ownerFID: number) {
  return {
    unstable_metaTags: [{ property: `frame:owner`, content: ownerFID.toString() }],
  }
}

export async function configureApp(app: Frog, c: FrameContext, browserLocationType = ''): Promise<IClickData> {
  const env = process.env
  // dummy mnemonic used
  const dappyKit = new SDK(
    Config.optimismMainnetConfig,
    'focus drama print win destroy venue term alter cheese retreat office cannon',
  )
  const appTitle = env?.APP_TITLE as string
  const appOwnerFID = Number(env?.APP_OWNER_FID)
  // todo get from the PK
  const appAddress = env?.APP_ADDRESS as string
  const appPk = env?.APP_PK as `0x${string}`
  const appAuthUrl = env?.APP_AUTH_URL as string
  const appShareUrl = env?.APP_SHARE_URL as string

  if (!appTitle || !appOwnerFID || Number.isNaN(appOwnerFID) || !appAddress || !appPk || !appAuthUrl || !appShareUrl) {
    throw new Error(`Required environment variables are not defined: ${JSON.stringify(env)}`)
  }

  app.metaTags = addMetaTags(appOwnerFID).unstable_metaTags

  if (browserLocationType === 'appAuthUrl') {
    app.browserLocation = appAuthUrl
  } else {
    app.browserLocation = 'https://dappykit.org/?source=frog-vercel-template'
  }

  const result: IClickData = {
    dappyKit,
    appTitle,
    userMainAddress: '',
    fid: 0,
    url: '',
    messageBytes: '',
    appAddress,
    appPk,
    appAuthUrl,
    appShareUrl,
  }

  try {
    const data = await c.req.json()
    const {
      trustedData: { messageBytes },
      untrustedData: { fid, url },
    } = data
    const userMainAddress = await dappyKit.farcasterClient.getCustodyAddress(fid)
    clickcasterLog(c, appPk).then().catch()
    result.fid = fid
    result.url = url
    result.messageBytes = messageBytes
    result.userMainAddress = userMainAddress
  } catch (e) {
    /* empty */
  }

  return result
}
