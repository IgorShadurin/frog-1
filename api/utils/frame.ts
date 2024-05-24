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
}

export function addMetaTags(ownerFID: number) {
  return {
    unstable_metaTags: [
      {property: `frame:owner`, content: ownerFID.toString()},
    ],
  }
}

export async function configureApp(app: Frog, c: FrameContext): Promise<IClickData> {
  const env = import.meta.env
  // dummy mnemonic used
  const dappyKit = new SDK(Config.optimismMainnetConfig, 'focus drama print win destroy venue term alter cheese retreat office cannon')
  const appTitle = env?.APP_TITLE as string
  const appOwnerFID = Number(env?.APP_OWNER_FID)
  const pageRedirectUrl = env?.PAGE_REDIRECT_URL as string
  const appAddress = env?.APP_ADDRESS as string
  const appPk = env?.APP_PK as `0x${string}`
  const appAuthUrl = env?.APP_AUTH_URL as string

  if (!appTitle || !appOwnerFID || Number.isNaN(appOwnerFID) || !pageRedirectUrl || !appAddress || !appPk || !appAuthUrl) {
    throw new Error('Required environment variables are not defined')
  }

  app.metaTags = addMetaTags(appOwnerFID).unstable_metaTags
  app.browserLocation = pageRedirectUrl

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
  }

  try {
    const data = await c.req.json()
    const {
      trustedData: {messageBytes},
      untrustedData: {fid, url}
    } = data
    const userMainAddress = await dappyKit.farcasterClient.getCustodyAddress(fid)
    clickcasterLog(c, appPk).then().catch()
    result.fid = fid
    result.url = url
    result.messageBytes = messageBytes
    result.userMainAddress = userMainAddress
  } catch (e) {
  }

  return result
}
