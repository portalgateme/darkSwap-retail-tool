import { ethers } from "ethers";
import axios from "axios";
import { deserializeDarkSwapMessage } from "@thesingularitynetwork/darkswap-sdk";
import { AssetPairDto, DarkSwapConfig, OrderDirection, OrderRetailDto, OrderType } from "../types";
import { ToolRetriableException } from "./exception";

export class AgentService {

    public constructor(
        private config: DarkSwapConfig
    ) { }


    public async getAssetPairs(chainId: number): Promise<AssetPairDto[]> {
        const agentUrl = this.config.agentUrl;
        const response = await axios.get(`${agentUrl}/tradingPairs/${chainId}`)
        return response.data.data as AssetPairDto[];
    }

    public async signMessage(message: string, signer: ethers.Signer): Promise<string> {
        const signature = await signer.signMessage(message);
        return signature;
    }

    public async submitOrder(chainId: number, retailOrder: OrderRetailDto, signer: ethers.Signer): Promise<string> {
        if (!retailOrder.swapMessage) {
            throw new Error('Swap message is required');
        }
        const agentUrl = this.config.agentUrl;
        const swapMessage = deserializeDarkSwapMessage(retailOrder.swapMessage);

        const timestamp = new Date().toISOString()
        const message = `${retailOrder.wallet.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await this.signMessage(message, signer);

        const response = await axios({
            method: 'post',
            url: `${agentUrl}/orders/create`,
            data: {
                wallet: retailOrder.wallet,
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
                'x-wallet-address': retailOrder.wallet.toLowerCase(),
                'x-wallet-signature': signature,
                'x-wallet-timestamp': timestamp,
            },
        })
        if (response.status !== 200 && response.status !== 201) {
            console.log('Submit order failed', response.data);
            throw new Error('Submit order failed');
        }

        return response.data.data.orderId;
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
        const signature = await this.signMessage(message, signer);

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

    public async cancelOrder(chainId: number, wallet: string, agentOrderId: string, signer: ethers.Signer): Promise<void> {
        const agentUrl = this.config.agentUrl;

        const timestamp = new Date().toISOString()
        const message = `${wallet.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await this.signMessage(message, signer);

        const response = await axios({
            method: 'post',
            url: `${agentUrl}/orders/cancel`,
            data: {
                wallet: wallet,
                chainId: chainId,
                orderId: agentOrderId,
            },
            headers: {
                'x-wallet-address': wallet.toLowerCase(),
                'x-wallet-signature': signature,
                'x-wallet-timestamp': timestamp,
            },
        })
        if (response.status !== 200 && response.status !== 201) {
            console.log('Cancel order failed', response.data);
            throw new Error('Cancel order failed');
        }
    }

    public async getOrderByTxHash(
        chainId: number,
        wallet: string,
        txHash: string,
        signer: ethers.Signer
    ): Promise<string | null> {
        const agentUrl = this.config.agentUrl;
        // Sign a message to get the order detail
        const timestamp = new Date().toISOString()
        const message = `${wallet.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await signer.signMessage(message);
        try {
            const response = await axios.get(`${agentUrl}/orders/query`, {
                params: {
                    chainId,
                    txHash
                },
                headers: {
                    'x-wallet-address': wallet.toLowerCase(),
                    'x-wallet-signature': signature,
                    'x-wallet-timestamp': timestamp
                }
            });
            if (response.status !== 200) throw new ToolRetriableException('Get orderId from agent failed');
            return response?.data?.data?.orderId || null;
        } catch (error) {
            if (error instanceof Error) {
                throw new ToolRetriableException('Get orderId from agent failed', error);
            } else {
                throw new ToolRetriableException('Get orderId from agent failed');
            }
        }
    }

    public async getOrderFilledByOrderId(
        chainId: number,
        orderId: string,
        wallet: string,
        signer: ethers.Signer
    ): Promise<boolean> {
        const agentUrl = this.config.agentUrl;
        // Sign a message to get the order detail
        const timestamp = new Date().toISOString()
        const message = `${wallet.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await signer.signMessage(message);

        try {
            const response = await axios.get(`${agentUrl}/orders/detail`, {
                params: {
                    orderId
                },
                headers: {
                    'x-wallet-address': wallet.toLowerCase(),
                    'x-wallet-signature': signature,
                    'x-wallet-timestamp': timestamp
                }
            });
            if (response.status !== 200) return false;
            const status = response.data?.data?.status || ''
            return [3, 10].includes(status);
        } catch (error) {
            return false
        }
    };

    public async finalizeOrder(chainId: number, wallet: string, agentOrderId: string, signer: ethers.Signer): Promise<void> {
        const agentUrl = this.config.agentUrl;

        const timestamp = new Date().toISOString()
        const message = `${wallet.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
        const signature = await this.signMessage(message, signer);

        const response = await axios({
            method: 'post',
            url: `${agentUrl}/orders/completeOrder`,
            data: {
                wallet: wallet,
                chainId: chainId,
                orderId: agentOrderId,
            },
            headers: {
                'x-wallet-address': wallet.toLowerCase(),
                'x-wallet-signature': signature,
                'x-wallet-timestamp': timestamp,
            },
        })
        if (response.status !== 200 && response.status !== 201) {
            console.log('Finalize order failed', response.data);
            throw new Error('Finalize order failed');
        }
    }
}