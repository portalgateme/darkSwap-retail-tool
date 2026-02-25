import {
  calcNullifier,
  DarkSwapError,
  DarkSwapMessage,
  DarkSwapNote,
  DarkSwapOrderNote,
  isAddressEquals
} from '@thesingularitynetwork/darkswap-sdk'
import {
  deserializeDarkSwapMessage,
  getNoteOnChainStatusByPublicKey,
  getNoteOnChainStatusBySignature,
  hexlify32,
  ProSwapService,
  NoteOnChainStatus,
  serializeDarkSwapMessage
} from '@thesingularitynetwork/darkswap-sdk'
import { BooknodeService } from '../common/booknode.service'
import { DarkSwapContext } from '../common/context/darkSwap.context'
import { DatabaseService } from '../common/db/database.service'
import { NoteService } from '../common/note.service'
import { NotesJoinService } from '../common/notesJoin.service'
import { SubgraphService } from '../common/subgraph.service'
import { getConfirmations } from '../config/networkConfig'
import { OrderEventService } from '../orders/orderEvent.service'
import { NoteDto, OrderDirection, OrderDto, OrderStatus } from '../types'
import { bobConfirmDto } from './dto/bobConfirm.dto'
import { RpcManager } from '../common/rpcManager'
import { getAuthInfo } from '../auth/authInfo.service'

export class SettlementService {
  private dbService: DatabaseService
  private booknodeService: BooknodeService
  private noteService: NoteService
  private noteJoinService: NotesJoinService
  private orderEventService: OrderEventService
  private subgraphService: SubgraphService
  private rpcManager: RpcManager
  public constructor(
    dbService: DatabaseService,
    booknodeService: BooknodeService,
    noteService: NoteService,
    noteJoinService: NotesJoinService,
    orderEventService: OrderEventService,
    subgraphService: SubgraphService,
    rpcManager: RpcManager
  ) {
    this.dbService = dbService
    this.booknodeService = booknodeService
    this.noteService = noteService
    this.noteJoinService = noteJoinService
    this.rpcManager = rpcManager
    this.orderEventService = orderEventService
    this.subgraphService = subgraphService
  }

  private async checkBobNoteStatus(
    darkSwapContext: DarkSwapContext,
    darkSwapMessage: DarkSwapMessage
  ) {
    const onChainStatus = await getNoteOnChainStatusByPublicKey(
      darkSwapContext.darkSwap,
      darkSwapMessage.orderNote,
      darkSwapMessage.publicKey
    )
    if (onChainStatus != NoteOnChainStatus.ACTIVE) {
      throw new DarkSwapError("counter party's note is not valid")
    }
  }

  private noteDtoToNote(noteDto: NoteDto): DarkSwapNote {
    return {
      note: noteDto.note,
      rho: noteDto.rho,
      asset: noteDto.asset,
      amount: noteDto.amount,
      address: noteDto.wallet
    } as DarkSwapNote
  }

  async aliceSwap(orderInfo: OrderDto) {
    await this.orderEventService.logOrderStatusChange(
      orderInfo.orderId,
      orderInfo.wallet,
      orderInfo.chainId,
      OrderStatus.MATCHED
    )

    const matchedOrderDto =
      await this.booknodeService.getMatchedOrderDetails(orderInfo)
    const bobSwapMessage = deserializeDarkSwapMessage(
      matchedOrderDto.bobSwapMessage
    )

    const darkSwapContext = await DarkSwapContext.createDarkSwapContext(
      orderInfo.chainId,
      orderInfo.wallet,
      this.rpcManager
    )
    //check note status

    if (!orderInfo.noteCommitment)
      throw new DarkSwapError('Order note commitment not found')

    const rawNote = await this.dbService.getNoteByCommitment(
      orderInfo.noteCommitment
    )
    const orderNote = this.noteDtoToNote(rawNote)
    const aliceNoteOnChainStatus = await getNoteOnChainStatusBySignature(
      darkSwapContext.darkSwap,
      orderNote,
      darkSwapContext.signature
    )
    if (aliceNoteOnChainStatus != NoteOnChainStatus.ACTIVE) {
      const aliceNullifier = orderInfo.nullifier
      const bobNullifier = hexlify32(
        calcNullifier(bobSwapMessage.orderNote.rho, bobSwapMessage.publicKey)
      )

      if (!aliceNullifier)
        throw new DarkSwapError('Alice nullifier not found for inactive note')
      const subgraphData = await this.subgraphService.getSwapTxByNullifiers(
        orderInfo.chainId,
        aliceNullifier,
        bobNullifier
      )
      if (subgraphData) {
        console.log('Order settle recovered for ', orderInfo.orderId)
        const incomingNoteDto = await this.dbService.getNoteByCommitment(
          BigInt(subgraphData.aliceInNote).toString()
        )
        const incomingNote = this.noteDtoToNote(incomingNoteDto)
        const unprocessedNotes = [incomingNote]
        if (BigInt(subgraphData.aliceChangeNote) !== 0n) {
          const changeNoteDto = await this.dbService.getNoteByCommitment(
            BigInt(subgraphData.aliceChangeNote).toString()
          )
          const changeNote = this.noteDtoToNote(changeNoteDto)
          unprocessedNotes.push(changeNote)
        }
        await this.updateAliceOrderData(
          orderInfo,
          { ...orderNote, feeRatio: BigInt(orderInfo.feeRatio) },
          unprocessedNotes,
          darkSwapContext,
          subgraphData.txHash
        )
        return
      }
      throw new DarkSwapError(
        `Order Note ${orderNote.note} is not active and no settlement transaction found`
      )
    }

    await this.checkBobNoteStatus(darkSwapContext, bobSwapMessage)

    const assetPair = await this.dbService.getAssetPairById(
      orderInfo.assetPairId,
      orderInfo.chainId
    )
    if (!assetPair) {
      throw new DarkSwapError('Asset pair not found')
    }
    const bobAsset =
      orderInfo.orderDirection === OrderDirection.BUY
        ? assetPair.quoteAddress
        : assetPair.baseAddress

    const proSwapService = new ProSwapService(darkSwapContext.darkSwap)
    const { context, swapInNote, changeNote } = await proSwapService.prepare(
      darkSwapContext.walletAddress,
      { ...orderNote, feeRatio: BigInt(orderInfo.feeRatio) },
      bobSwapMessage.address,
      bobSwapMessage,
      darkSwapContext.signature
    )

    const notesToAdd = [swapInNote]
    if (changeNote.amount !== 0n) {
      notesToAdd.push(changeNote)
    }
    this.noteService.addNotes(notesToAdd, darkSwapContext, false)
    this.dbService.updateOrderIncomingNoteCommitment(
      orderInfo.orderId,
      swapInNote.note
    )

    const tx = await proSwapService.execute(context)

    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new DarkSwapError('pro swap failed with tx hash ' + tx)
    }

    await this.updateAliceOrderData(
      orderInfo,
      { ...orderNote, feeRatio: BigInt(orderInfo.feeRatio) },
      notesToAdd,
      darkSwapContext,
      tx
    )
  }

  private async updateAliceOrderData(
    order: OrderDto,
    aliceOutNote: DarkSwapOrderNote,
    aliceInNotes: DarkSwapNote[],
    darkSwapContext: DarkSwapContext,
    txHash: string
  ) {
    this.noteService.setNoteUsed(aliceOutNote, darkSwapContext)

    await this.dbService.updateOrderSettlementTransaction(order.orderId, txHash)
    await this.booknodeService.settleOrder(order, txHash)
    console.log('Order settled for ', order.orderId)
    await this.orderEventService.logOrderStatusChange(
      order.orderId,
      order.wallet,
      order.chainId,
      OrderStatus.SETTLED
    )

    for (const note of aliceInNotes) {
      if (note && note.amount !== 0n) {
        await this.noteService.setNoteActive(note, darkSwapContext, txHash)
        await this.noteJoinService.getCurrentBalanceNote(
          darkSwapContext,
          note.asset
        )
      }
    }
  }

  async bobPostSettlement(orderInfo: OrderDto, txHash: string) {
    const matchedOrderDetail =
      await this.booknodeService.getMatchedOrderDetails(orderInfo)
    const bobSwapMessage = deserializeDarkSwapMessage(
      matchedOrderDetail.bobSwapMessage
    )

    if (!orderInfo.noteCommitment || !orderInfo.wallet)
      throw new DarkSwapError('Order note commitment or wallet not found')
    const outgoingNote = await this.dbService.getNoteByCommitment(
      orderInfo.noteCommitment
    )
    const darkSwapContext = await DarkSwapContext.createDarkSwapContext(
      orderInfo.chainId,
      orderInfo.wallet,
      this.rpcManager
    )
    this.noteService.setNoteUsed(
      this.noteDtoToNote(outgoingNote),
      darkSwapContext
    )
    await this.dbService.updateOrderSettlementTransaction(
      orderInfo.orderId,
      txHash
    )
    if (bobSwapMessage.inNote) {
      const incomingNote = await this.dbService.getNoteByCommitment(
        bobSwapMessage.inNote.note.toString()
      )
      await this.noteService.setNoteActive(
        this.noteDtoToNote(incomingNote),
        darkSwapContext,
        txHash
      )
      await this.noteJoinService.getCurrentBalanceNote(
        darkSwapContext,
        incomingNote.asset,
        [this.noteDtoToNote(incomingNote)]
      )
    }
    console.log('Post settlement for ', orderInfo.orderId)
    await this.orderEventService.logOrderStatusChange(
      orderInfo.orderId,
      orderInfo.wallet,
      orderInfo.chainId,
      OrderStatus.SETTLED
    )
    await this.booknodeService.bobPostSettlement({
      orderId: orderInfo.orderId,
      wallet: orderInfo.wallet,
      chainId: orderInfo.chainId
    })
  }

  async matchedForAlice(orderInfo: OrderDto) {
    if (orderInfo.status === OrderStatus.OPEN) {
      await this.orderEventService.logOrderStatusChange(
        orderInfo.orderId,
        orderInfo.wallet,
        orderInfo.chainId,
        OrderStatus.MATCHED
      )
      await this.dbService.updateOrderMatched(orderInfo.orderId)
    } else {
      console.log(
        'Order ',
        orderInfo.orderId,
        ' is not in open status',
        orderInfo.status
      )
    }
  }

  async bobConfirm(orderInfo: OrderDto) {
    //get orderdetail from bookNode
    const orderDetail =
      await this.booknodeService.getMatchedOrderDetails(orderInfo)
    if (orderDetail.bobSwapMessage) {
      //just skip it
      console.log('Order ', orderInfo.orderId, ' has already been confirmed')
      return
    }

    if (!orderInfo.noteCommitment) {
      throw new DarkSwapError('Order note commitment not found')
    }

    const assetPair = await this.dbService.getAssetPairById(
      orderInfo.assetPairId,
      orderInfo.chainId
    )

    if (!assetPair) {
      throw new DarkSwapError('Asset pair not found')
    }

    const rawNote = await this.dbService.getNoteByCommitment(
      orderInfo.noteCommitment
    )
    const orderNote = {
      note: rawNote.note,
      rho: rawNote.rho,
      asset: rawNote.asset,
      amount: rawNote.amount,
      feeRatio: BigInt(orderInfo.feeRatio),
      address: orderInfo.wallet
    } as DarkSwapOrderNote

    const swapInAsset = isAddressEquals(orderNote.asset, assetPair.quoteAddress)
      ? assetPair.baseAddress
      : assetPair.quoteAddress

    const darkSwapContext = await DarkSwapContext.createDarkSwapContext(
      orderInfo.chainId,
      orderInfo.wallet,
      this.rpcManager
    )
    const darkSwapMessage = await ProSwapService.prepareProSwapMessageForBob(
      darkSwapContext.walletAddress,
      orderNote,
      BigInt(orderInfo.amountIn),
      swapInAsset,
      darkSwapContext.signature
    )

    this.noteService.addNote(darkSwapMessage.inNote, darkSwapContext, false)
    this.dbService.updateOrderIncomingNoteCommitment(
      orderInfo.orderId,
      darkSwapMessage.inNote.note
    )

    const bobConfirmDto = {
      chainId: orderInfo.chainId,
      wallet: orderInfo.wallet,
      orderId: orderInfo.orderId,
      swapMessage: serializeDarkSwapMessage(darkSwapMessage)
    } as bobConfirmDto

    await this.booknodeService.confirmOrder(bobConfirmDto)
    console.log('Order confirmed for ', orderInfo.orderId)
    await this.orderEventService.logOrderStatusChange(
      orderInfo.orderId,
      orderInfo.wallet,
      orderInfo.chainId,
      OrderStatus.MATCHED
    )
  }
}
