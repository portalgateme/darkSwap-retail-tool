import { createNoteCryptoContext, DarkSwap, deriveKey, NoteCryptoContext } from "@thesingularitynetwork/darkswap-sdk"
import { getAddress, Signer } from "ethers"
import { getDarkSwap } from "../../utils/darkSwap"
import { RpcManager } from "../rpcManager"

export class DarkSwapContext {
    chainId: number
    signer: Signer
    walletAddress: string
    publicKey: string
    darkSwap: DarkSwap
    signature: string
    signatureV2: string
    cryptoContext: NoteCryptoContext

    private constructor(chain: number, wallet: string, signer: Signer, pubKey: string, darkSwap: DarkSwap, signatureV1: string, signatureV2: string, cryptoContext: NoteCryptoContext) {
        this.chainId = chain
        this.walletAddress = wallet
        this.signer = signer
        this.publicKey = pubKey
        this.darkSwap = darkSwap
        this.signature = signatureV1
        this.signatureV2 = signatureV2
        this.cryptoContext = cryptoContext
    }

    getSignatureByMessageVersion(version?: number) {
        if (version != null && version >= 2) {
            return this.signatureV2
        }
        return this.signature
    }

    static async createSignatureV1(chain: number, walletIn: string, signer: Signer) {
        const wallet = getAddress(walletIn.toLowerCase());
        const domain = {};

        const types = {
            'Zero Knowledge Proof Key Creation': [
                { name: 'user', type: 'address' },
                { name: 'action', type: 'string' },
                { name: 'disclaimer', type: 'string' },
            ],
        };

        const value = {
            user: wallet.toLowerCase(),
            action:
                "Please sign this message to create your own Zero Knowledge proof key-pair. This doesn't cost you anything and is free of any gas fees.",
            disclaimer: 'Only sign this message on singularity website!',
        };

        const signature = await signer.signTypedData(domain, types, value);
        console.log("signature", signature);
        return signature
    }

    static async createSignatureV2(chain: number, walletIn: string, signer: Signer) {
        const wallet = getAddress(walletIn.toLowerCase());
        const domain = {
            name: 'darkswap.me',
            version: '2',
        }

        const types = {
            'Zero Knowledge Proof Key Creation': [
                { name: 'user', type: 'address' },
                { name: 'action', type: 'string' },
                { name: 'disclaimer', type: 'string' },
            ],
        };

        const value = {
            user: wallet.toLowerCase(),
            action:
                "Please sign this message to create your own Zero Knowledge proof key-pair. This doesn't cost you anything and is free of any gas fees.",
            disclaimer: 'Only sign this message on singularity website!',
        };

        const signature = await signer.signTypedData(domain, types, value);
        console.log("signature", signature);
        return signature
    }

    private static getCryptoContext(wallet: string, signature: string) {
        const keyHex = deriveKey(
            signature,
            'DarkSwap Note Encryption Salt ' + wallet.toLowerCase()
        )
        return createNoteCryptoContext(
            wallet,
            keyHex
        )
    }

    static async createDarkSwapContext(chain: number, walletIn: string, rpcManager: RpcManager) {
        const wallet = getAddress(walletIn.toLowerCase());
        const [signer, pubKey] = rpcManager.getSignerAndPublicKey(wallet, chain)
        const darkSwap = getDarkSwap(chain, signer)
        const signatureV1 = await DarkSwapContext.createSignatureV1(chain, wallet, signer)
        const signatureV2 = await DarkSwapContext.createSignatureV2(chain, wallet, signer)
        const cryptoContext = DarkSwapContext.getCryptoContext(wallet, signatureV2)

        return new DarkSwapContext(chain, wallet, signer, pubKey, darkSwap, signatureV1, signatureV2, cryptoContext)
    }
} 
