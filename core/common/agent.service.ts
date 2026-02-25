// import { ethers } from "ethers";
// import { getAgentUrl } from "../utils/web3";
// import { AssetPair, getWalletByWalletAddress, WalletTask } from "./database";
// import axios from "axios";
// import { deserializeDarkSwapMessage } from "@thesingularitynetwork/darkswap-sdk";

// export const getAssetPairs = async (chainId: number): Promise<AssetPair[]> => {
//     const agentUrl = getAgentUrl(chainId);
//     const response = await axios.get(`${agentUrl}/tradingPairs/${chainId}`)
//     return response.data.data as AssetPair[];
// }

// const signMessage = async (message: string, wallet: ethers.Wallet): Promise<string> => {
//     const signature = await wallet.signMessage(message);
//     return signature;
// }

// export const submitOrder = async (chainId: number, walletTask: WalletTask, wallet: ethers.Wallet) => {
//     const agentUrl = getAgentUrl(chainId);
//     const swapMessage = deserializeDarkSwapMessage(walletTask.darkSwapMessage);

//     const timestamp = new Date().toISOString()
//     const message = `${walletTask.wallet.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
//     const signature = await signMessage(message, wallet);

//     const response = await axios({
//         method: 'post',
//         url: `${agentUrl}/orders/create`,
//         data: {
//             wallet: wallet.address,
//             chainId: chainId,
//             assetPairId: walletTask.asset_pair,
//             orderDirection: walletTask.direction === 'buy' ? 0 : 1,
//             orderType: 0,
//             timeInForce: 0,
//             stpMode: 0,
//             price: walletTask.price,
//             amountOut: swapMessage.orderNote.amount.toString(),
//             amountIn: (swapMessage.inNote.amount + swapMessage.feeAmount).toString(),
//             swapMessage: walletTask.darkSwapMessage,
//             txHashCreated: walletTask.depositTx,
//             nullifier: swapMessage.orderNullifier,
//         },
//         headers: {
//             'x-wallet-address': wallet.address,
//             'x-wallet-signature': signature,
//             'x-wallet-timestamp': timestamp,
//         },
//     })
//     if (response.status !== 200 && response.status !== 201) {
//         console.log('Submit order failed', response.data);
//         throw new Error('Submit order failed');
//     }
// }

// export const submitOrderFromSwap = async (
//   chainId: number,
//   walletAddress: string,
//   assetPairId: string,
//   direction: 'buy' | 'sell',
//   price: number,
//   swapMessage: string,
//   txHashCreated: string,
//   nullifier: string,
//   signer: ethers.Wallet
// ) => {
//   const agentUrl = getAgentUrl(chainId);
//   const swapMessageObj = deserializeDarkSwapMessage(swapMessage);
//   const timestamp = new Date().toISOString()
//   const message = `${walletAddress.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
//   const signature = await signer.signMessage(message);

//   const response = await axios({
//     method: 'post',
//     url: `${agentUrl}/orders/create`,
//     data: {
//       wallet: walletAddress,
//       chainId,
//       assetPairId,
//       orderDirection: direction === 'buy' ? 0 : 1,
//       orderType: 0,
//       timeInForce: 0,
//       stpMode: 0,
//       price,
//       amountOut: swapMessageObj.orderNote.amount.toString(),
//       amountIn: (swapMessageObj.inNote.amount + swapMessageObj.feeAmount).toString(),
//       swapMessage,
//       txHashCreated,
//       nullifier
//     },
//     headers: {
//       'x-wallet-address': walletAddress.toLowerCase(),
//       'x-wallet-signature': signature,
//       'x-wallet-timestamp': timestamp
//     }
//   });
//   if (response.status !== 200 && response.status !== 201) {
//     throw new Error('Submit order failed');
//   }
//   return response.data.data.orderId;
// };

// export const getOrderFilledByOrderId = async (
//   chainId: number,
//   orderId: string,
//   signer: ethers.Wallet
// ): Promise<boolean> => {
//   const agentUrl = getAgentUrl(chainId);
//   // Sign a message to get the order detail
//   const timestamp = new Date().toISOString()
//   const message = `${signer.address.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
//   const signature = await signer.signMessage(message);
//   const response = await axios.get(`${agentUrl}/orders/detail`, {
//     params: {
//       orderId
//     },
//     headers: {
//       'x-wallet-address': signer.address.toLowerCase(),
//       'x-wallet-signature': signature,
//       'x-wallet-timestamp': timestamp
//     }
//   });
//   if (response.status !== 200) return false;
//   const status = response.data?.data?.status || '';
//   return [3, 10].includes(status);
// };
