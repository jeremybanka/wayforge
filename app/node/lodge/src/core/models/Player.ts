import { produce, immerable } from "immer"
import { nanoid } from "nanoid"

import type { Card } from "."
import type {
  IActionRequest,
  IVirtualActionRequest,
  IVirtualImperative,
  RealTargets,
  TargetType,
  VirtualTargets,
} from "../actions/types"
import type {
  CardGroupId,
  TrueId,
  VirtualId,
  CardId,
  VirtualCardId,
  VirtualCardGroupId,
  VirtualCardCycleId,
  CardCycleId,
} from "../util/Id"
import { PlayerId, anonClassDict, virtualIdClassDict } from "../util/Id"
import mapObject from "../util/mapObject"

export class Perspective {
  // players[playerId].virtualize(trueId)
  public [immerable] = true

  public virtualIds: Record<string, VirtualId>

  public trueIds: Record<string, TrueId>

  public virtualActionLog: IVirtualActionRequest[]

  public constructor() {
    this.virtualIds = {}
    this.trueIds = {}
    this.virtualActionLog = []
  }

  public virtualizeId: {
    (id: CardId): VirtualCardId
    (id: CardGroupId): VirtualCardGroupId
    (id: CardCycleId): VirtualCardCycleId
  } = (id: TrueId): VirtualId => {
    const virtual =
      this.virtualIds[id.toString()] || new anonClassDict[id.of](nanoid())
    // console.log(id)
    return virtual
  }

  public virtualizeIds = (reals: TrueId[]): VirtualId[] =>
    reals.map((target: TrueId) => this.virtualizeId(target))

  public virtualizeEntry = (real: TrueId | TrueId[]): VirtualId | VirtualId[] =>
    Array.isArray(real) ? this.virtualizeIds(real) : this.virtualizeId(real)

  public virtualizeTargets = (
    targets?: RealTargets
  ): VirtualTargets | undefined =>
    targets &&
    mapObject<TargetType, TrueId | TrueId[], VirtualId | VirtualId[]>(
      targets,
      this.virtualizeEntry
    )

  public devirtualizeId: {
    (id: VirtualCardId): CardId
    (id: VirtualCardGroupId): CardGroupId
    (id: VirtualCardCycleId): CardCycleId
  } = (id: VirtualId): TrueId => this.trueIds[id.toString()]

  public devirtualizeIds = (virtuals: VirtualId[] = []): TrueId[] =>
    virtuals.map((target) => this.devirtualizeId(target))

  public devirtualizeEntry = (
    virtual: VirtualId | VirtualId[]
  ): TrueId | TrueId[] =>
    Array.isArray(virtual)
      ? this.virtualizeIds(virtual)
      : this.virtualizeId(virtual)

  public devirtualizeTargets = (
    targets?: VirtualTargets
  ): RealTargets | undefined =>
    targets &&
    mapObject<TargetType, VirtualId | VirtualId[], TrueId | TrueId[]>(
      targets,
      this.devirtualizeEntry
    )

  public deriveImperative = (action: IActionRequest): IVirtualImperative => ({
    id: nanoid(),
    options: action.payload.options,
    type: action.type,
    actorId: action.payload.actorId && this.virtualizeId(action.payload.actorId),
    targets: this.virtualizeTargets(action.payload.targets),
  })

  public hide = (trueId: TrueId): void => {
    const trueIdString = trueId.toString()
    const virtualIdString = this.virtualizeId(trueId).toString()
    this.trueIds = produce(this.trueIds, (draft) => {
      delete draft[virtualIdString]
    })
    this.virtualIds = produce(this.virtualIds, (draft) => {
      delete draft[trueIdString]
    })
  }

  public show = (trueId: TrueId): void => {
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
  public [immerable] = true

  public id: PlayerId

  public displayName: string

  public handIdsByCycleId: Record<string, CardGroupId>

  public inbox: (CardGroupId | CardId)[]

  public userId: number

  public imperativeLog: IVirtualImperative[]

  public constructor(displayName: string, userId: number) {
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

  public devirtualizeRequest = (
    request: IVirtualActionRequest
  ): IActionRequest => {
    const { type, options } = request
    return {
      type,
      payload: {
        actorId: this.id,
        options,
        targets: this.devirtualizeTargets(request.targets),
      },
    }
  }

  public receive = (card: Card): void => {
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
