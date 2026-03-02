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
