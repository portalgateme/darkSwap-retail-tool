import { ethers } from "ethers";
import axios from "axios";
import { deserializeDarkSwapMessage } from "@thesingularitynetwork/darkswap-sdk";
import { AssetPairDto, DarkSwapConfig, OrderDirection, OrderRetailDto, OrderType } from "../types";

export class AgentService {

    public constructor(
        private config: DarkSwapConfig
    ) { }


    public async getAssetPairs(chainId: number): Promise<AssetPairDto[]> {
        const agentUrl = this.config.agentUrl;
        const response = await axios.get(`${agentUrl}/tradingPairs/${chainId}`)
        return response.data.data as AssetPairDto[];
    }

    public async signMessage(message: string, wallet: ethers.Wallet): Promise<string> {
        const signature = await wallet.signMessage(message);
        return signature;
    }

    public async submitOrder(chainId: number, retailOrder: OrderRetailDto, wallet: ethers.Wallet) {
        if (!retailOrder.swapMessage) {
            throw new Error('Swap message is required');
        }
        const agentUrl = this.config.agentUrl;
        const swapMessage = deserializeDarkSwapMessage(retailOrder.swapMessage);

        const timestamp = new Date().toISOString()
        const message = `${wallet.address.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await this.signMessage(message, wallet);

        const response = await axios({
            method: 'post',
            url: `${agentUrl}/orders/create`,
            data: {
                wallet: wallet.address,
                chainId: chainId,
                assetPairId: retailOrder.assetPairId,
                orderDirection: retailOrder.orderDirection === OrderDirection.BUY ? 0 : 1,
                orderType: OrderType.LIMIT,
                timeInForce: 0,
                stpMode: 0,
                price: retailOrder.price,
                amountOut: swapMessage.orderNote.amount.toString(),
                amountIn: (swapMessage.inNote.amount + swapMessage.feeAmount).toString(),
                swapMessage: retailOrder.swapMessage,
                txHashCreated: retailOrder.txHashCreated,
                nullifier: swapMessage.orderNullifier,
            },
            headers: {
                'x-wallet-address': wallet.address,
                'x-wallet-signature': signature,
                'x-wallet-timestamp': timestamp,
            },
        })
        if (response.status !== 200 && response.status !== 201) {
            console.log('Submit order failed', response.data);
            throw new Error('Submit order failed');
        }
    }

    public async submitOrderFromSwap(
        chainId: number,
        walletAddress: string,
        assetPairId: string,
        direction: 'buy' | 'sell',
        price: number,
        swapMessage: string,
        txHashCreated: string,
        nullifier: string,
        signer: ethers.Wallet
    ) {
        const agentUrl = this.config.agentUrl;
        const swapMessageObj = deserializeDarkSwapMessage(swapMessage);
        const timestamp = new Date().toISOString()
        const message = `${walletAddress.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await signer.signMessage(message);

        const response = await axios({
            method: 'post',
            url: `${agentUrl}/orders/create`,
            data: {
                wallet: walletAddress,
                chainId,
                assetPairId,
                orderDirection: direction === 'buy' ? 0 : 1,
                orderType: 0,
                timeInForce: 0,
                stpMode: 0,
                price,
                amountOut: swapMessageObj.orderNote.amount.toString(),
                amountIn: (swapMessageObj.inNote.amount + swapMessageObj.feeAmount).toString(),
                swapMessage,
                txHashCreated,
                nullifier
            },
            headers: {
                'x-wallet-address': walletAddress.toLowerCase(),
                'x-wallet-signature': signature,
                'x-wallet-timestamp': timestamp
            }
        });
        if (response.status !== 200 && response.status !== 201) {
            throw new Error('Submit order failed');
        }
        return response.data.data.orderId;
    };

    public async getOrderFilledByOrderId(
        chainId: number,
        orderId: string,
        signer: ethers.Wallet
    ): Promise<boolean> {
        const agentUrl = this.config.agentUrl;
        // Sign a message to get the order detail
        const timestamp = new Date().toISOString()
        const message = `${signer.address.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await signer.signMessage(message);
        const response = await axios.get(`${agentUrl}/orders/detail`, {
            params: {
                orderId
            },
            headers: {
                'x-wallet-address': signer.address.toLowerCase(),
                'x-wallet-signature': signature,
                'x-wallet-timestamp': timestamp
            }
        });
        if (response.status !== 200) return false;
        const status = response.data?.data?.status || '';
        return [3, 10].includes(status);
    };

}
