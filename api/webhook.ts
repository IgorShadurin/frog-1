import dappykit from '@dappykit/sdk'
import {
  kvDeleteDelegatedToPk,
  kvDeleteMainToDelegated,
  kvGetMnemonic,
  kvPutDelegatedAddress,
  kvPutProof,
} from './utils/kv.js'
import { VercelRequest, VercelResponse } from '@vercel/node'

const {SDK, Config} = dappykit


export interface ICallbackResult {
  success: boolean;
  requestId: number;
  userMainAddress: string;
  userDelegatedAddress: string;
  applicationAddress: string;
  proof: string;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'POST') {
    const dappyKit = new SDK(Config.optimismMainnetConfig, 'focus drama print win destroy venue term alter cheese retreat office cannon')
    const appAddress = process.env.APP_ADDRESS
    const authServiceAddress = process.env.AUTH_SERVICE_ADDRESS

    if (!appAddress || !authServiceAddress) {
      const error = 'Environment variables are not set properly.'
      console.error(error)
      response.status(500).json({error})
      return
    }

    try {
      const body = request.body as ICallbackResult
      console.log('Callback data:', JSON.stringify(body))

      await dappyKit.farcasterClient.checkCallbackData(body, appAddress, authServiceAddress)

      if (!body?.success) {
        console.log('Callback is not success. Deleting stored data.')
        await kvDeleteMainToDelegated(body.userMainAddress)
        await kvDeleteDelegatedToPk(body.userDelegatedAddress)
        response.status(200).json({result: true})
        return
      }

      // if mnemonic is already stored than we can create a connection between main and delegated addresses
      if (await kvGetMnemonic(body.userDelegatedAddress)) {
        await kvPutDelegatedAddress(body.userMainAddress, body.userDelegatedAddress)
        await kvPutProof(body.userDelegatedAddress, body.proof)
      }

      response.status(200).json({result: true})
    } catch (e) {
      const error = (e as Error).message
      console.error('Error:', error)
      response.status(400).json({error})
    }
  } else {
    response.setHeader('Allow', ['POST'])
    response.status(405).end(`Method ${request.method} Not Allowed`)
  }
}
