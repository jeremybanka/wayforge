/* eslint-disable max-lines */

import { produce } from "immer"
import { nanoid } from "nanoid"
import type { StoreApi } from "zustand/vanilla"

import type { JsonObj } from "~/packages/anvl/src/json"

import type { CoreGameActions, CoreGameData, GameAction } from "./types"
import type { GameSession } from "../../store/game"
import type { CardGroup, IZoneProps } from "../models"
import {
  Card,
  CardCycle,
  CardValue,
  Deck,
  Hand,
  Pile,
  Player,
  Trick,
  Zone,
  ZoneLayout,
} from "../models"
import type { TrueId, ZoneLayoutId } from "../util/Id"
import { CardGroupId, PlayerId, ZoneId } from "../util/Id"
import mapObject from "../util/mapObject"

export const useCoreActions = <
  GameData extends CoreGameData,
  GameActions extends Record<string, GameAction<GameData>>
>(
  game: StoreApi<GameSession>
): CoreGameActions => {
  const {
    forEach,
    getPlayers,
    identify: get,
    mapPlayers,
    match,
    merge,
    run,
    showPlayers,
  } = game.getState()
  return {
    clearTable: () => {
      const clearPlayer = (player: Player): Player =>
        produce(player, (draft) => {
          draft.inbox = []
        })
      const playersById = mapObject(
        game.getState().playersById,
        clearPlayer
      ) as Record<string, Player>
      return {
        cardsById: {},
        cardCyclesById: {},
        cardGroupsById: {},
        cardValuesById: {},
        playersById,
        zonesById: {},
        zoneLayoutsById: {},
      }
    },

    createCardCycle: ({ targets, options: { phaseNames } }) => {
      const phases = phaseNames.map((phaseName) => {
        if (Array.isArray(targets[phaseName])) {
          const cardGroupIds = targets[phaseName] as CardGroupId[]
          const phaseProtoMap = cardGroupIds.map((id: TrueId) => {
            if (id instanceof PlayerId) {
              const hand = new Hand({})
              return [id, hand.id] as [PlayerId, CardGroupId]
            } else if (id instanceof ZoneId) {
              const zone = get(id) as Zone
              if (zone.ownerId instanceof PlayerId) {
                return [zone.ownerId, id] as [PlayerId, ZoneId]
              }
              throw new Error(`zone has no owner`)
            } else {
              throw new Error(`invalid phase array`)
            }
          }) as
            | Iterable<readonly [PlayerId, CardGroupId]>
            | Iterable<readonly [PlayerId, ZoneId]> as any
          return new Map(phaseProtoMap) as
            | Map<PlayerId, CardGroupId>
            | Map<PlayerId, ZoneId>
        }
        if (targets[phaseName] instanceof CardGroupId) return targets[phaseName]
        if (targets[phaseName] instanceof ZoneId) return targets[phaseName]
        throw new Error(`invalid phase`)
      })
      const newCardCycle = new CardCycle({ id: nanoid(), phases })
      return merge([newCardCycle]).into(`cardCyclesById`)
    },

    createCardGroup: ({
      targets: { ownerId, cardValueIds, zoneId },
      options: { type },
    }) => {
      // console.log(`CREATE_CARD_GROUP`)
      const classes = { Deck, Pile, Trick }

      // if (options.className === `Pile`)console.log(ownerId)
      // const cardsById = { ...get().cardsById }
      // console.log(`cardValueIds`, cardValueIds?.length)
      const newCards =
        cardValueIds?.map((valueId) => {
          const idIsBogus = !get(valueId)
          if (idIsBogus) throw new Error(`id ${valueId} has no real value`)
          const card = new Card(valueId)
          return card
        }) || []
      // console.log(`newCards`, newCards?.length)

      const cardIds = newCards.map((card) => card.id)
      const newCardGroup = new classes[type]({ id: nanoid(), cardIds, ownerId })

      if (zoneId) {
        // console.log(`ZONE_ID`)
        try {
          const zone = get(zoneId) as Zone
          const newZone = produce(zone, (draft) => draft.place(newCardGroup))
          // console.log(`New ZONE`, newZone)
          // console.log(`newcards`, newCards)
          const update = {
            ...merge(newCards).into(`cardsById`),
            ...merge([newCardGroup]).into(`cardGroupsById`),
            ...merge([newZone]).into(`zonesById`),
          }
          // console.log(`UPDATE`, update)
          return update
        } catch (e) {
          console.log(e)
        }
      }
      const update = {
        ...merge(newCards).into(`cardsById`),
        ...merge([newCardGroup]).into(`cardGroupsById`),
      }
      // console.log(`UPDATE`, update)
      return update
    },

    createCardValues: <CardData extends JsonObj>({ options: { data } }) => {
      const newCardValues: CardValue<CardData>[] = data.map(
        (value) => new CardValue<CardData>({ content: value })
      )
      newCardValues.forEach((value) => showPlayers(value.id))
      return merge(newCardValues).into(`cardValuesById`)
    },

    // CREATE_DECK: ({ targets, options = {} }) =>
    //   game.getState().actions.CREATE_CARD_GROUP.run({
    //     targets,
    //     options: { ...options, className: `Deck` },
    //   }),

    // CREATE_HAND: ({ targets, options = {} }) => {
    //   const { ownerId } = targets as { ownerId: PlayerId }
    //   const { id } = options as { id?: string }
    //   const newHand = new Hand({ id, ownerId })
    //   return merge([newHand]).into(`cardGroupsById`)
    // },

    createPlayer: ({ options }) => {
      const { userId, socketId } = options as {
        userId: number
        socketId: string
      }
      const newPlayer = new Player(`displayName`, userId)
      const playerId = newPlayer.id.toString()
      game.setState((state: GameSession) => {
        const newPlayers = mapPlayers((player) => player.show(newPlayer.id))
        state.playersById = newPlayers
        newPlayer.show(newPlayer.id)
        forEach<Player>(`playersById`, (player) => newPlayer.show(player.id))
        return state
      })
      const state = game.getState()
      console.log({ state })
      const playersById = {
        ...game.getState().playersById,
        [playerId]: newPlayer,
      }
      const playerIdsByUserId = { [userId]: playerId }
      game.getState().registerSocket(socketId).to(newPlayer)
      return { playersById, playerIdsByUserId }
    },

    CREATE_PILE: ({ targets, options = {} }) =>
      game.getState().actions.CREATE_CARD_GROUP.run({
        targets,
        options: { ...options, className: `Pile` },
      }),

    CREATE_TRICK: () => ({}),

    CREATE_ZONE: {
      domain: `System`,
      run: ({ targets, options = {} }) => {
        const { zoneLayoutId, ownerId } = targets as {
          zoneLayoutId: ZoneLayoutId
          ownerId: PlayerId
        }
        const { id, contentType } = options as IZoneProps
        const newZone = new Zone({ id, contentType, ownerId })
        const zoneLayout = get(zoneLayoutId) as ZoneLayout
        const newZoneLayout = produce(zoneLayout, (draft) => {
          draft.content.push(newZone.id)
        })
        showPlayers(newZone.id)
        return {
          ...merge([newZone]).into(`zonesById`),
          ...merge([newZoneLayout]).into(`zoneLayoutsById`),
        }
      },
    },

    CREATE_ZONE_LAYOUT: ({ targets = {}, options = {} }) => {
      const { id } = options as { id?: string }
      const { ownerId } = targets as { ownerId?: PlayerId }
      const newZoneLayout = new ZoneLayout({ id, ownerId })

      showPlayers(newZoneLayout.id)
      return merge([newZoneLayout]).into(`zoneLayoutsById`)
    },

    deal: ({ targets: { deckId }, options: { dealHowMany } }) => {
      // console.log(`DEAL`, targets)
      // while (roundsRemaining) {
      //   const deck = identify(deckId) as Deck
      //   // console.log(roundsRemaining, `rounds remaining`,
      //   // deck.cardIds.length, `cards left`)
      //   if (deck.cardIds.length < getPlayers().length) break
      //   forEach<Player>(`playersById`, (p) => {
      //     run(`DRAW`, { actorId: p.id, targets: { deckId } })
      //   })
      //   --roundsRemaining
      // }
      const group = get(deckId)
      if (!(group instanceof Deck)) {
        throw new Error(`Can only deal from a deck, not a ${group.class}`)
      }
      const deck = group

      return {
        cardGroupsById: {},
      }
    },

    DEAL_ALL: ({ targets }) => {
      // console.log(`DEAL_ALL`, targets)
      const { deckId } = targets as { deckId: CardGroupId }
      const deck = get(deckId) as Deck
      return game.getState().actions.DEAL.run({
        targets,
        options: { howMany: deck.cardIds.length },
      })
    },

    DRAW: ({ actorId, targets }) => {
      if (!actorId) throw new Error(``)
      const { deckId } = targets as { deckId: CardGroupId }
      // console.log(`DRAW`, targets, actorId)
      const actor = get(actorId) as Player | undefined
      const targetDeck = get(deckId) as Deck | undefined
      if (!actor) throw new Error(``)
      if (!targetDeck) throw new Error(``)

      const handId = match<CardGroup>(
        `cardGroupId`,
        (cardGroup) =>
          cardGroup.ownerId === actorId && cardGroup.class === `Hand`
      )
      run(`MOVE`, {
        targets: {
          originId: deckId,
          destinationId: handId,
        },
        options: { howMany: 1, originIdx: 0, destinationIdx: 0 },
      })
      return {}
    },

    MOVE: ({ targets, options }) => {
      const { originId, destinationId } = targets as {
        originId: CardGroupId
        destinationId: CardGroupId
      }
      const { howMany, originIdx, destinationIdx } = options as Record<
        string,
        number
      >

      const origin: CardGroup = get(originId)
      const destination = get(destinationId) as CardGroup

      let cardIds

      const newOrigin = produce(origin, (cardGroup) => {
        cardIds = cardGroup.cardIds.splice(originIdx, howMany)
      })
      const newDestination = produce(destination, (cardGroup) => {
        cardGroup.cardIds.splice(destinationIdx, 0, cardIds)
      })

      return merge([newOrigin, newDestination]).into(`cardGroupsById`)
    },

    PLACE: () => ({}),

    SHUFFLE: () => {
      console.log(`shuffle`)
      return {}
    },
  }
}

export const installCoreActions = <
  Props extends Record<string, any>,
  Actions extends Record<string, GameAction<CoreGameData & Props>>
>(
  game: StoreApi<GameSession<Props, Actions>>
): StoreApi<GameSession<Props, Actions & CoreGameActions>> => (
  game.setState((state) => ({
    ...state,
    actions: {
      ...state.actions,
      ...useCoreActions(game),
    },
  })),
  game as StoreApi<GameSession<Props, Actions & CoreGameActions>>
)
