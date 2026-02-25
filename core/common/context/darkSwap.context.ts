import { DarkSwap } from "@thesingularitynetwork/darkswap-sdk"
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

    private constructor(chain: number, wallet: string, signer: Signer, pubKey: string, darkSwap: DarkSwap,  signature: string) {
        this.chainId = chain
        this.walletAddress = wallet
        this.signer = signer
        this.publicKey = pubKey
        this.darkSwap = darkSwap
        this.signature = signature
    }

    static async createDarkSwapContext(chain: number, walletIn: string, rpcManager: RpcManager) {
        const wallet = getAddress(walletIn.toLowerCase());
        const [signer, pubKey] = rpcManager.getSignerAndPublicKey(wallet, chain)
        const darkSwap = getDarkSwap(chain, signer)

        const domain = {
            name: "SingularityDarkSwapClientServer",
            version: "1",
        };

        const types = {
            Message: [
                { name: "wallet", type: "string" },
                { name: "content", type: "string" },
            ],
        };

        const value = {
            wallet: wallet,
            content: "Please sign this message to create your own Zero Knowledge proof key-pair. This doesn't cost you anything and is free of any gas fees.",
        };

        const signature = await signer.signTypedData(domain, types, value);
        return new DarkSwapContext(chain, wallet, signer, pubKey, darkSwap, signature)
    }
} 