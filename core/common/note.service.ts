import {
  DarkSwapNote,
  getNullifierBySignature,
  hexlify32
} from '@thesingularitynetwork/darkswap-sdk'
import { DarkSwapContext } from './context/darkSwap.context'
import { DatabaseService } from './db/database.service'
import { NoteStatus, NoteType, OrderNoteStatus } from '../types'
import { ethers } from 'ethers'
import { networkConfig } from '../config/networkConfig'
import MerkleAbi from '../abis/MerkleTreeOperator.json'
import { RpcManager } from './rpcManager'

export class NoteService {
  private dbService: DatabaseService
  private rpcManager: RpcManager

  public constructor(dbService: DatabaseService, rpcManager: RpcManager) {
    this.dbService = dbService
    this.rpcManager = rpcManager
  }

  public async addNotes(
    notes: DarkSwapNote[],
    darkSwapContext: DarkSwapContext,
    isOrderNote: boolean
  ) {
    for (const note of notes) {
      if (note && note.amount !== 0n) {
        this.addNote(note, darkSwapContext, isOrderNote)
      }
    }
  }

  public addNote(
    note: DarkSwapNote,
    darkSwapContext: DarkSwapContext,
    isOrderNote: boolean,
    txHash?: string
  ) {
    this.dbService.addNote(
      darkSwapContext.chainId,
      darkSwapContext.publicKey,
      darkSwapContext.walletAddress,
      isOrderNote ? NoteType.DARKSWAP_ORDER : NoteType.DARKSWAP,
      note.note,
      note.rho,
      note.asset,
      note.amount,
      txHash ? txHash : ''
    )
  }

  public setNoteUsed(note: DarkSwapNote, darkSwapContext: DarkSwapContext) {
    this.dbService.updateNoteSpentByWalletAndNoteCommitment(
      darkSwapContext.walletAddress,
      darkSwapContext.chainId,
      note.note
    )
  }

  public async setNotesActive(
    notes: DarkSwapNote[],
    darkSwapContext: DarkSwapContext,
    txHash: string
  ) {
    for (const note of notes) {
      await this.setNoteActive(note, darkSwapContext, txHash)
    }
  }

  public async setNoteActive(
    note: DarkSwapNote,
    darkSwapContext: DarkSwapContext,
    txHash: string
  ) {
    await this.dbService.updateNoteTransactionByWalletAndNoteCommitment(
      darkSwapContext.walletAddress,
      darkSwapContext.chainId,
      note.note,
      txHash
    )
  }

  private async getNoteCommitmentStatus(
    note: bigint,
    chainId: number
  ): Promise<boolean> {
    try {
      const contract = new ethers.Contract(
        networkConfig[chainId].merkleTreeOperator,
        MerkleAbi.abi,
        this.rpcManager.getProvider(chainId)
      )
      const result = await contract.noteIsNotCreated(hexlify32(note))
      return !result
    } catch (e) {
      console.log(e)
      return false
    }
  }

  private async getNoteUsedStatus(
    nullifier: string,
    chainId: number
  ): Promise<boolean> {
    try {
      const contract = new ethers.Contract(
        networkConfig[chainId].merkleTreeOperator,
        MerkleAbi.abi,
        this.rpcManager.getProvider(chainId)
      )
      const result = await contract.nullifiersUsed(nullifier)
      return result as boolean
    } catch (e) {
      console.log(e)
      return false
    }
  }

  private async getNoteLockedStatus(
    nullifier: string,
    chainId: number
  ): Promise<boolean> {
    try {
      const contract = new ethers.Contract(
        networkConfig[chainId].merkleTreeOperator,
        MerkleAbi.abi,
        this.rpcManager.getProvider(chainId)
      )
      const result = await contract.nullifiersLocked(nullifier)
      return result as boolean
    } catch (e) {
      console.log(e)
      return false
    }
  }

  public async checkNoteByChain(
    note: DarkSwapNote,
    signature: string,
    chainId: number
  ): Promise<OrderNoteStatus> {
    return this.getOnChainStatus(note, signature, chainId)
  }

  public async checkNoteByPubkey(
    note: DarkSwapNote,
    fuzkPubKey: any,
    chainId: number
  ): Promise<OrderNoteStatus> {
    return this.getOnChainStatusByPubKey(note, fuzkPubKey, chainId)
  }

  private async getOnChainStatus(
    note: DarkSwapNote,
    signature: string,
    chainId: number
  ): Promise<OrderNoteStatus> {
    const commitmentStatus = await this.getNoteCommitmentStatus(
      note.note,
      chainId
    )
    if (commitmentStatus) {
      const nullifier = await getNullifierBySignature(note, signature)
      const isSpent = await this.getNoteUsedStatus(nullifier, chainId)
      if (isSpent) {
        return OrderNoteStatus.USED
      }
      return OrderNoteStatus.VERFIED
    } else {
      return OrderNoteStatus.INVALID
    }
  }

  private async getOnChainStatusByPubKey(
    note: DarkSwapNote,
    fuzkPubKey: any,
    chainId: number
  ): Promise<OrderNoteStatus> {
    const commitmentStatus = await this.getNoteCommitmentStatus(
      note.note,
      chainId
    )
    if (commitmentStatus) {
      const nullifier = await getNullifierBySignature(note, fuzkPubKey)
      const usedStatus = await this.getNoteUsedStatus(nullifier, chainId)
      if (usedStatus) {
        return OrderNoteStatus.USED
      } else {
        return OrderNoteStatus.VERFIED
      }
    } else {
      return OrderNoteStatus.PENDING
    }
  }
}
