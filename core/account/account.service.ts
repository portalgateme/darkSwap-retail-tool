import { DatabaseService } from '../common/db/database.service'
import { DarkSwapConfig, MyAssetsDto, NoteStatus } from '../types'
import {
  getNoteOnChainStatusBySignature,
  NoteOnChainStatus
} from '@thesingularitynetwork/darkswap-sdk'
import { DarkSwapContext } from '../common/context/darkSwap.context'
import { Logger } from 'tslog'

export class AccountService {
  private readonly logger = new Logger({ name: AccountService.name })

  private dbService: DatabaseService
  private config: DarkSwapConfig

  public constructor(config: DarkSwapConfig, dbService: DatabaseService) {
    this.dbService = dbService
    this.config = config
  }

  async getWallets(): Promise<string[]> {
    return this.config.wallets.map((wallet) => wallet.address)
  }

  async getAssetsByChainId(
    wallet: string,
    chainId: number
  ): Promise<MyAssetsDto> {
    const notes = await this.dbService.getAssetsNotesByWalletAndChainId(
      wallet,
      chainId
    )
    const assetMap = new Map<string, { amount: bigint; lockedAmount: bigint }>()

    for (const note of notes) {
      const assetKey = note.asset

      const current = assetMap.get(assetKey) || {
        amount: BigInt(0),
        lockedAmount: BigInt(0)
      }

      if (note.status === NoteStatus.ACTIVE) {
        current.amount += BigInt(note.amount)
      } else if (note.status === NoteStatus.LOCKED) {
        current.lockedAmount += BigInt(note.amount)
      }

      assetMap.set(assetKey, current)
    }

    const myAssets: MyAssetsDto = {
      chainId: Number(chainId),
      assets: []
    }

    for (const [asset, { amount, lockedAmount }] of assetMap.entries()) {
      myAssets.assets.push({
        asset,
        amount: amount.toString(),
        lockedAmount: lockedAmount.toString()
      })
    }

    return myAssets
  }

  async getAssets(wallet: string): Promise<MyAssetsDto[]> {
    const notes = await this.dbService.getNotesByWallet(wallet)

    const chainMap = new Map<
      string,
      Map<string, { amount: bigint; lockedAmount: bigint }>
    >()

    for (const note of notes) {
      const chainId = note.chainId
      const assetKey = note.asset

      if (!chainMap.has(chainId.toString())) {
        chainMap.set(chainId.toString(), new Map())
      }

      const assetMap = chainMap.get(chainId.toString())!
      const current = assetMap.get(assetKey) || {
        amount: BigInt(0),
        lockedAmount: BigInt(0)
      }

      if (note.status === NoteStatus.ACTIVE) {
        current.amount += BigInt(note.amount)
      } else if (note.status === NoteStatus.LOCKED) {
        current.lockedAmount += BigInt(note.amount)
      }

      assetMap.set(assetKey, current)
    }

    const myAssetsArray: MyAssetsDto[] = []

    for (const [chainId, assetMap] of chainMap.entries()) {
      const myAssets: MyAssetsDto = {
        chainId: Number(chainId),
        assets: []
      }

      for (const [asset, { amount, lockedAmount }] of assetMap.entries()) {
        myAssets.assets.push({
          asset,
          amount: amount.toString(),
          lockedAmount: lockedAmount.toString()
        })
      }

      myAssetsArray.push(myAssets)
    }

    return myAssetsArray
  }

  async syncOneAsset(
    darkSwapContext: DarkSwapContext,
    wallet: string,
    chainId: number,
    asset: string
  ): Promise<void> {
    const notes = (
      await this.dbService.getNotesByWalletAndChainIdAndAsset(
        wallet,
        chainId,
        asset
      )
    ).sort((a, b) => (a.amount < b.amount ? 1 : -1))

    for (const note of notes) {
      try {
        if (note.status != NoteStatus.SPENT) {
          const onChainStatus = await getNoteOnChainStatusBySignature(
            darkSwapContext.darkSwap,
            {
              note: note.note,
              rho: note.rho,
              amount: note.amount,
              asset: note.asset,
              address: note.wallet
            },
            darkSwapContext.signature
          )
          if (
            onChainStatus == NoteOnChainStatus.ACTIVE &&
            note.status != NoteStatus.ACTIVE
          ) {
            this.dbService.updateNoteActiveByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          } else if (
            onChainStatus == NoteOnChainStatus.LOCKED &&
            note.status != NoteStatus.LOCKED
          ) {
            this.dbService.updateNoteLockedByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          } else if (
            onChainStatus == NoteOnChainStatus.SPENT &&
            note.status != NoteStatus.SPENT
          ) {
            this.dbService.updateNoteSpentByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          } else if (
            onChainStatus == NoteOnChainStatus.UNKNOWN &&
            note.status != NoteStatus.CREATED
          ) {
            this.dbService.updateNoteCreatedByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          }
        }
      } catch (error: any) {
        this.logger.error(
          `Error syncing asset ${note.asset} on chain ${chainId}: ${error.message}`
        )
      }
    }
  }

  async syncAssets(
    darkSwapContext: DarkSwapContext,
    wallet: string,
    chainId: number
  ): Promise<void> {
    const notes = await this.dbService.getNotesByWalletAndChainId(
      wallet,
      chainId
    )

    for (const note of notes) {
      try {
        if (note.status != NoteStatus.SPENT) {
          const onChainStatus = await getNoteOnChainStatusBySignature(
            darkSwapContext.darkSwap,
            {
              note: note.note,
              rho: note.rho,
              amount: note.amount,
              asset: note.asset,
              address: note.wallet
            },
            darkSwapContext.signature
          )
          if (
            onChainStatus == NoteOnChainStatus.ACTIVE &&
            note.status != NoteStatus.ACTIVE
          ) {
            this.dbService.updateNoteActiveByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          } else if (
            onChainStatus == NoteOnChainStatus.LOCKED &&
            note.status != NoteStatus.LOCKED
          ) {
            this.dbService.updateNoteLockedByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          } else if (
            onChainStatus == NoteOnChainStatus.SPENT &&
            note.status != NoteStatus.SPENT
          ) {
            this.dbService.updateNoteSpentByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          } else if (
            onChainStatus == NoteOnChainStatus.UNKNOWN &&
            note.status != NoteStatus.CREATED
          ) {
            this.dbService.updateNoteCreatedByWalletAndNoteCommitment(
              wallet,
              chainId,
              note.note
            )
          }
        }
      } catch (error: any) {
        this.logger.error(
          `Error syncing asset ${note.asset} on chain ${chainId}: ${error.message}`
        )
      }
    }
  }
}
