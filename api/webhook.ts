import dappykit from '@dappykit/sdk';
import {
  kvGetMnemonic,
  kvPutDelegatedAddress,
  kvPutProof,
} from './utils/kv.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

const { SDK, Config, ViemUtils } = dappykit;
const { generateMnemonic, english } = ViemUtils;

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
    const dappyKit = new SDK(Config.optimismMainnetConfig, generateMnemonic(english));
    const appAddress = process.env.APP_ADDRESS;
    const authServiceAddress = process.env.AUTH_SERVICE_ADDRESS;

    if (!appAddress || !authServiceAddress) {
      response.status(500).json({ error: 'Environment variables are not set properly.' });
      return;
    }

    try {
      const body = request.body as ICallbackResult;
      if (!body?.success) {
        // after implementation of error signature move this condition below of `checkCallbackData` to perform kv removing
        // in the case of not implement do not remove these kvs because anybody can send data
        // await kvDeleteMainToDelegated(env, body.userMainAddress)
        // await kvDeleteDelegatedToPk(env, body.userDelegatedAddress)
        throw new Error('Callback is not successful');
      }

      await dappyKit.farcasterClient.checkCallbackData(body, appAddress, authServiceAddress);

      // if mnemonic is already stored than we can create a connection between main and delegated addresses
      if (await kvGetMnemonic(body.userDelegatedAddress)) {
        await kvPutDelegatedAddress(body.userMainAddress, body.userDelegatedAddress);
        await kvPutProof(body.userDelegatedAddress, body.proof);
      }

      response.status(200).json({ result: true });
    } catch (e) {
      response.status(400).json({ error: 'Invalid JSON or bad request.', message: (e as Error).message });
    }
  } else {
    response.setHeader('Allow', ['POST']);
    response.status(405).end(`Method ${request.method} Not Allowed`);
  }
}
