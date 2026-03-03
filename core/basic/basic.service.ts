import {
  DarkSwapError,
  DarkSwapNote,
  WithdrawService
} from '@thesingularitynetwork/darkswap-sdk'
import { Logger } from 'tslog'
import { DarkSwapContext } from '../common/context/darkSwap.context'
import { DatabaseService } from '../common/db/database.service'
import { NoteService } from '../common/note.service'
import { getConfirmations } from '../config/networkConfig'

export class BasicService {
  private readonly logger = new Logger({ name: BasicService.name })

  private dbService: DatabaseService
  private noteService: NoteService

  public constructor(
    dbService: DatabaseService,
    noteService: NoteService
  ) {
    this.dbService = dbService
    this.noteService = noteService
  }

  // Withdraw specific note
  async withdrawNote(darkSwapContext: DarkSwapContext, note: DarkSwapNote) {
    const withdrawService = new WithdrawService(darkSwapContext.darkSwap)

    if (note.amount < 0n) {
      throw new DarkSwapError('Insufficient funds')
    }

    const { context: withdrawContext, newBalanceNote } =
      await withdrawService.prepare(
        darkSwapContext.walletAddress,
        note,
        note.amount,
        darkSwapContext.signature
      )

    const tx = await withdrawService.execute(withdrawContext)

    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new DarkSwapError('Withdraw failed')
    }

    // TODO: retail in not is not stored
    // this.noteService.setNoteUsed(note, darkSwapContext)

    this.logger.info(
      `Withdraw of ${note.amount} ${note.asset} for wallet ${darkSwapContext.walletAddress} completed with tx ${withdrawContext.tx}`
    )
  }
}
