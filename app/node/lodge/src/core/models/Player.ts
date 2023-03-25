import { produce, immerable } from "immer"
import { nanoid } from "nanoid"

import { Perspective } from "~/packages/obscurity/src"

import type { Card } from "."
import type { GameEntityId, GameEntityIdSystem } from "../../store/game"
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
