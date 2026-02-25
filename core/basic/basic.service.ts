import {
  DarkSwapError,
  DepositService,
  WithdrawService
} from '@thesingularitynetwork/darkswap-sdk'
import { Logger } from 'tslog'
import { DarkSwapContext } from '../common/context/darkSwap.context'
import { DatabaseService } from '../common/db/database.service'
import { NoteService } from '../common/note.service'
import { NotesJoinService } from '../common/notesJoin.service'
import { getConfirmations } from '../config/networkConfig'

export class BasicService {
  private readonly logger = new Logger({ name: BasicService.name })

  private dbService: DatabaseService
  private noteService: NoteService
  private notesJoinService: NotesJoinService
  public constructor(
    dbService: DatabaseService,
    noteService: NoteService,
    notesJoinService: NotesJoinService
  ) {
    this.dbService = dbService
    this.noteService = noteService
    this.notesJoinService = notesJoinService
  }

  // Method to deposit funds
  async deposit(
    darkSwapContext: DarkSwapContext,
    asset: string,
    amount: bigint
  ) {
    const depositService = new DepositService(darkSwapContext.darkSwap)

    const currentBalanceNote =
      await this.notesJoinService.getCurrentBalanceNote(darkSwapContext, asset)

    const { context, newBalanceNote } = await depositService.prepare(
      currentBalanceNote,
      asset,
      BigInt(amount),
      darkSwapContext.walletAddress,
      darkSwapContext.signature
    )

    this.noteService.addNote(newBalanceNote, darkSwapContext, false)

    const tx = await depositService.execute(context)

    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new Error('Deposit failed')
    }

    if (currentBalanceNote.note != 0n) {
      this.noteService.setNoteUsed(currentBalanceNote, darkSwapContext)
    }
    await this.dbService.updateNoteTransactionByWalletAndNoteCommitment(
      darkSwapContext.walletAddress,
      darkSwapContext.chainId,
      newBalanceNote.note,
      tx
    )
    this.logger.info(
      `Deposit of ${amount} ${asset} for wallet ${darkSwapContext.walletAddress} completed with tx ${tx}`
    )
  }

  // Method to withdraw funds
  async withdraw(
    darkSwapContext: DarkSwapContext,
    asset: string,
    amount: bigint
  ) {
    const withdrawService = new WithdrawService(darkSwapContext.darkSwap)

    const currentBalanceNote =
      await this.notesJoinService.getCurrentBalanceNote(darkSwapContext, asset)

    if (currentBalanceNote.amount < amount) {
      throw new DarkSwapError('Insufficient funds')
    }

    const { context: withdrawContext, newBalanceNote } =
      await withdrawService.prepare(
        darkSwapContext.walletAddress,
        currentBalanceNote,
        amount,
        darkSwapContext.signature
      )

    if (newBalanceNote.amount > 0n) {
      this.noteService.addNote(newBalanceNote, darkSwapContext, false)
    }

    const tx = await withdrawService.execute(withdrawContext)

    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new DarkSwapError('Withdraw failed')
    }

    this.noteService.setNoteUsed(currentBalanceNote, darkSwapContext)

    if (newBalanceNote.amount > 0n) {
      this.noteService.setNoteActive(newBalanceNote, darkSwapContext, tx)
    }
    this.logger.info(
      `Withdraw of ${amount} ${asset} for wallet ${darkSwapContext.walletAddress} completed with tx ${withdrawContext.tx}`
    )
  }
}
