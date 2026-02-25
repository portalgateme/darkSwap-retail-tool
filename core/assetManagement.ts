import { AccountService } from "./account/account.service";
import { BasicService } from "./basic/basic.service";
import { DarkSwapContext } from "./common/context/darkSwap.context";
import { WalletMutexService } from "./common/mutex/walletMutex.service";
import { RpcManager } from "./common/rpcManager";
import { BaseDto, DepositDto, MyAssetsDto, SyncAssetDto, WithdrawDto } from "./types";

export class AssetManager{
    private walletMutexService: WalletMutexService;
    private accountService: AccountService;
    private basicService: BasicService;
    private rpcManager: RpcManager;

    constructor(accountService: AccountService, basicService: BasicService, rpcManager: RpcManager) {
        this.walletMutexService = WalletMutexService.getInstance();
        this.accountService = accountService;
        this.basicService = basicService;
        this.rpcManager = rpcManager;
    }

    public async getWallets(): Promise<string[]> {
        return this.accountService.getWallets();
    }

    public async getAssetsByChainIdAndWallet(baseDto: BaseDto): Promise<MyAssetsDto> {
        const mutex = this.walletMutexService.getMutex(baseDto.chainId, baseDto.wallet.toLowerCase());
        return await mutex.runExclusive(async () => {
            return this.accountService.getAssetsByChainId(baseDto.wallet, baseDto.chainId);
        });
    }

    public async syncAssets(baseDto: BaseDto): Promise<void> {
        const context = await DarkSwapContext.createDarkSwapContext(baseDto.chainId, baseDto.wallet, this.rpcManager)
        const mutex = this.walletMutexService.getMutex(baseDto.chainId, context.walletAddress.toLowerCase());
        await mutex.runExclusive(async () => {
            return this.accountService.syncAssets(context, baseDto.wallet, baseDto.chainId);
        });
    }

    public async syncOneAsset(syncAssetDto: SyncAssetDto): Promise<void> {
        const context = await DarkSwapContext.createDarkSwapContext(syncAssetDto.chainId, syncAssetDto.wallet, this.rpcManager)
        const mutex = this.walletMutexService.getMutex(syncAssetDto.chainId, context.walletAddress.toLowerCase());
        await mutex.runExclusive(async () => {
            return this.accountService.syncOneAsset(context, syncAssetDto.wallet, syncAssetDto.chainId, syncAssetDto.asset);
        });
    }

    public async deposit(depositDto: DepositDto) {
        const context = await DarkSwapContext.createDarkSwapContext(depositDto.chainId, depositDto.wallet, this.rpcManager)
        const mutex = this.walletMutexService.getMutex(context.chainId, context.walletAddress.toLowerCase());
        await mutex.runExclusive(async () => {
            await this.basicService.deposit(context, depositDto.asset, BigInt(depositDto.amount));
        });
    }

    public async withdraw(withdrawDto: WithdrawDto) {
        const context = await DarkSwapContext.createDarkSwapContext(withdrawDto.chainId, withdrawDto.wallet, this.rpcManager)
        const mutex = this.walletMutexService.getMutex(context.chainId, context.walletAddress.toLowerCase());
        await mutex.runExclusive(async () => {
            await this.basicService.withdraw(context, withdrawDto.asset, BigInt(withdrawDto.amount));
        });
    }
}
