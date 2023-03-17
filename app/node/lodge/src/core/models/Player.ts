import produce, { immerable } from "immer"
import { nanoid } from "nanoid"
import {
  IActionRequest,
  IVirtualActionRequest,
  IVirtualImperative,
  RealTargets,
  TargetType,
  VirtualTargets,
} from "../actions/types"
import { Card } from "."
import {
  PlayerId,
  CardGroupId,
  TrueId,
  VirtualId,
  CardId,
  VirtualCardId,
  VirtualCardGroupId,
  VirtualCardCycleId,
  CardCycleId,
  anonClassDict,
  virtualIdClassDict,
} from "../util/Id"
import mapObject from "../util/mapObject"

export class Perspective { // players[playerId].virtualize(trueId)
  [immerable] = true

  virtualIds: Record<string, VirtualId>

  trueIds: Record<string, TrueId>

  virtualActionLog: IVirtualActionRequest[]

  constructor() {
    this.virtualIds = {}
    this.trueIds = {}
    this.virtualActionLog = []
  }

  virtualizeId: {
    (id: CardId): VirtualCardId
    (id: CardGroupId): VirtualCardGroupId
    (id: CardCycleId): VirtualCardCycleId
  } = (id: TrueId): VirtualId => {
    const virtual = this.virtualIds[id.toString()]
    || new anonClassDict[id.of](nanoid())
    // console.log(id)
    return virtual
  }

  virtualizeIds = (reals: TrueId[]): VirtualId[] =>
    reals.map((target:TrueId) => this.virtualizeId(target))

  virtualizeEntry = (real:TrueId[]|TrueId): VirtualId[]|VirtualId =>
    Array.isArray(real)
      ? this.virtualizeIds(real)
      : this.virtualizeId(real)

  virtualizeTargets = (targets?:RealTargets): VirtualTargets|undefined =>
    targets && mapObject<TargetType, TrueId|TrueId[], VirtualId|VirtualId[]>(
      targets, this.virtualizeEntry
    )

  devirtualizeId: {
    (id: VirtualCardId): CardId
    (id: VirtualCardGroupId): CardGroupId
    (id: VirtualCardCycleId): CardCycleId
  } = (id: VirtualId): TrueId => this.trueIds[id.toString()]

  devirtualizeIds = (virtuals: VirtualId[] = []): TrueId[] =>
    virtuals.map(target => this.devirtualizeId(target))

  devirtualizeEntry = (virtual:VirtualId[]|VirtualId): TrueId[]|TrueId =>
    Array.isArray(virtual)
      ? this.virtualizeIds(virtual)
      : this.virtualizeId(virtual)

  devirtualizeTargets = (targets?: VirtualTargets): RealTargets|undefined =>
    targets && mapObject<TargetType, VirtualId|VirtualId[], TrueId|TrueId[]>(
      targets, this.devirtualizeEntry
    )

  deriveImperative = (action: IActionRequest): IVirtualImperative => ({
    id: nanoid(),
    options: action.payload.options,
    type: action.type,
    actorId: action.payload.actorId
    && this.virtualizeId(action.payload.actorId),
    targets: this.virtualizeTargets(action.payload.targets),
  })

  hide = (trueId:TrueId): void => {
    const trueIdString = trueId.toString()
    const virtualIdString = this.virtualizeId(trueId).toString()
    this.trueIds = produce(
      this.trueIds,
      draft => { delete draft[virtualIdString] }
    )
    this.virtualIds = produce(
      this.virtualIds,
      draft => { delete draft[trueIdString] }
    )
  }

  show = (trueId:TrueId): void => {
    const virtualId = new virtualIdClassDict[trueId.of]()
    const trueIdString = trueId.toString()
    const virtualIdString = virtualId.toString()
    this.trueIds = { ...this.trueIds, [virtualIdString]: trueId }
    this.virtualIds = { ...this.virtualIds, [trueIdString]: virtualId }
    // console.log(`trueIds`, this.trueIds)
    // console.log(`virtualIds`, this.virtualIds)
    // this.trueIds[virtualIdString] = trueId
    // this.virtualIds[trueIdString] = virtualId
  }
}

export class Player extends Perspective {
  [immerable] = true

  id: PlayerId

  displayName: string

  handIdsByCycleId: Record<string, CardGroupId>

  inbox: (CardId|CardGroupId)[]

  userId: number

  imperativeLog: IVirtualImperative[]

  constructor(displayName:string, userId:number) {
    super()
    this.id = new PlayerId()
    this.handIdsByCycleId = {}
    this.inbox = []
    this.displayName = displayName
    this.userId = userId
    this.imperativeLog = []
    // this.hand = []
    // this.deck = []
    // discardPile = []
  }

  devirtualizeRequest
  = (request: IVirtualActionRequest)
  : IActionRequest => {
    const { type, options } = request
    return ({
      type,
      payload: {
        actorId: this.id,
        options,
        targets: this.devirtualizeTargets(request.targets),
      },
    })
  }

  receive = (card:Card): void => {
    if (card.ownerId?.toString() === this.id.toString()) console.log(`bingo`)
  }
}

/*
Player brings cards into game

Cards reside within CardGroups. They belong to cycles.

CardGroups [Decks, Hands, Piles] reside within layouts

Layouts reside within

Cycles contain Phases
The first Phase of a cycle is considered the
"home" or "starting" phase

*/
