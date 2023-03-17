import produce from "immer"
import { a } from "eny/build/node"
import { StoreApi } from "zustand/vanilla"
import { GameSession } from "../../store/game"
import {
  Card,
  CardCycle,
  CardGroup,
  CardValue,
  Deck,
  Hand,
  IZoneProps,
  Pile,
  Player,
  Trick,
  Zone,
  ZoneLayout,
} from "../models"
import {
  CardGroupId,
  CardValueId,
  PlayerId,
  TrueId,
  ZoneId,
  ZoneLayoutId,
} from "../util/Id"
import mapObject from "../util/mapObject"
import  { ActionType, IAction, RealTargets  } from "./types"

export const useCoreActions
= (game:StoreApi<GameSession>)
: Record<ActionType, IAction> => {
  const set = fn => game.setState(fn)
  const get = () => game.getState()
  const {
    forEach,
    getPlayers,
    identify,
    mapPlayers,
    match,
    merge,
    run,
    showPlayers,
  } = get()
  return ({

    CLEAR_TABLE: {
      domain: `System`,
      run: () => {
        const clearPlayer = (player:Player): Player =>
          produce(player, draft => {
            draft.inbox = []
          })
        const playersById
        = mapObject(get().playersById, clearPlayer) as Record<string, Player>
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
    },

    CREATE_CARD_CYCLE: {
      domain: `System`,
      run: ({ targets, options }) => {
        if (!(targets && options)) throw new Error(`invalid call`)
        const realTargets = targets as RealTargets
        const { id, phaseNames } = options as {
          phaseNames: (keyof RealTargets)[],
          id?: string
        }
        const phases = phaseNames.map(phaseName => {
          const phase = realTargets[phaseName]
          if (!phase) throw new Error(`invalid call`)
          if (Array.isArray(phase)) {
            const phaseProtoMap = phase.map((id:TrueId) => {
              if (id instanceof PlayerId) {
                const hand = new Hand({})
                return [id, hand.id] as [PlayerId, CardGroupId]
              } else if (id instanceof ZoneId) {
                const zone = identify(id) as Zone
                if (zone.ownerId instanceof PlayerId) {
                  return [zone.ownerId, id] as [PlayerId, ZoneId]
                }
                throw new Error(`zone has no owner`)
              } else { throw new Error(`invalid phase array`) }
            })
            return new Map(phaseProtoMap)
          }
          if (phase instanceof CardGroupId) return phase
          if (phase instanceof ZoneId) return phase
          throw new Error(`invalid phase`)
        })
        const newCardCycle = new CardCycle({ id, phases })
        return merge([newCardCycle]).into(`cardCyclesById`)
      },
    },

    CREATE_CARD_GROUP: {
      domain: `System`,
      run: ({ targets, options = {} }) => {
        // console.log(`CREATE_CARD_GROUP`)
        const classes = { Deck, Pile, Trick }
        const { cardValueIds, zoneId, ownerId } = targets as {
          cardValueIds?: CardValueId[]
          ownerId?: PlayerId
          zoneId?: ZoneId
        }
        // if (options.className === `Pile`)console.log(ownerId)
        const { id, className = `Deck` } = options as {
          id?:string,
          className?:keyof typeof classes
        }
        // const cardsById = { ...get().cardsById }
        // console.log(`cardValueIds`, cardValueIds?.length)
        const newCards = cardValueIds?.map(valueId => {
          const idIsBogus = !identify(valueId)
          if (idIsBogus) throw new Error(`id ${valueId} has no real value`)
          const card = new Card(valueId)
          return card
        }) || []
        // console.log(`newCards`, newCards?.length)

        const cardIds = newCards.map(card => card.id)
        const newCardGroup = new classes[className]({ id, cardIds, ownerId })

        if (zoneId) {
          // console.log(`ZONE_ID`)
          try {
            const zone = identify(zoneId) as Zone
            const newZone = produce(zone, draft => draft.place(newCardGroup))
            // console.log(`New ZONE`, newZone)
            // console.log(`newcards`, newCards)
            const update = {
              ...merge(newCards).into(`cardsById`),
              ...merge([newCardGroup]).into(`cardGroupsById`),
              ...merge([newZone]).into(`zonesById`),
            }
            // console.log(`UPDATE`, update)
            return update
          } catch (e) { console.log(e) }
        }
        const update = {
          ...merge(newCards).into(`cardsById`),
          ...merge([newCardGroup]).into(`cardGroupsById`),
        }
        // console.log(`UPDATE`, update)
        return update
      },
    },

    CREATE_CARD_VALUES: {
      domain: `System`,
      run: ({ options }) => {
        const { values } = options as {values:{rank:string, suit:string}[]}
        const newCardValues: CardValue[]
        = values.map(value => new CardValue({ content: value }))
        newCardValues.forEach(value => showPlayers(value.id))
        return merge(newCardValues).into(`cardValuesById`)
      },
    },

    CREATE_DECK: {
      domain: `System`,
      run: ({ targets, options = {} }) =>
        get().actions.CREATE_CARD_GROUP.run({
          targets,
          options: { ...options, className: `Deck` },
        }),
    },

    CREATE_HAND: {
      domain: `System`,
      run: ({ targets, options = {} }) => {
        const { ownerId } = targets as {ownerId:PlayerId}
        const { id } = options as {id?:string}
        const newHand = new Hand({ id, ownerId })
        return merge([newHand]).into(`cardGroupsById`)
      },
    },

    CREATE_PLAYER: {
      domain: `System`,
      run: ({ options }) => {
        const { userId, socketId } = options as {userId:number, socketId:string}
        const newPlayer = new Player(`displayName`, userId)
        const playerId = newPlayer.id.toString()
        set((state:GameSession) => {
          const newPlayers = mapPlayers(player => player.show(newPlayer.id))
          state.playersById = newPlayers
          newPlayer.show(newPlayer.id)
          forEach<Player>(`playersById`, player => newPlayer.show(player.id))
        })
        const playersById = {
          ...get().playersById,
          [playerId]: newPlayer,
        }
        const playerIdsByUserId = { [userId]: playerId }
        get().registerSocket(socketId).to(newPlayer)
        return { playersById, playerIdsByUserId }
      },
    },

    CREATE_PILE: {
      domain: `System`,
      run: ({ targets, options = {} }) =>
        get().actions.CREATE_CARD_GROUP.run({
          targets,
          options: { ...options, className: `Pile` },
        }),
    },

    CREATE_TRICK: {
      domain: `System`,
      run: () => ({}),
    },

    CREATE_ZONE: {
      domain: `System`,
      run: ({ targets, options = {} }) => {
        const { zoneLayoutId, ownerId } = targets as {
          zoneLayoutId:ZoneLayoutId,
          ownerId:PlayerId
        }
        const { id, contentType } = options as IZoneProps
        const newZone = new Zone({ id, contentType, ownerId })
        const zoneLayout = identify(zoneLayoutId) as ZoneLayout
        const newZoneLayout = produce(zoneLayout, draft => {
          draft.content.push(newZone.id)
        })
        showPlayers(newZone.id)
        return {
          ...merge([newZone]).into(`zonesById`),
          ...merge([newZoneLayout]).into(`zoneLayoutsById`),
        }
      },
    },

    CREATE_ZONE_LAYOUT: {
      domain: `System`,
      run: ({ targets = {}, options = {} }) => {
        const { id } = options as {id?:string}
        const { ownerId } = targets as {ownerId?:PlayerId}
        const newZoneLayout = new ZoneLayout({ id, ownerId })

        showPlayers(newZoneLayout.id)
        return merge([newZoneLayout]).into(`zoneLayoutsById`)
      },
    },

    DEAL: {
      domain: `Deck`,
      run: ({ targets, options = {} }) => {
        // console.log(`DEAL`, targets)
        const { deckId } = targets as {deckId:CardGroupId}
        let { howMany: roundsRemaining = 1 } = options as {howMany?:number}
        while (roundsRemaining) {
          const deck = identify(deckId) as Deck
          // console.log(roundsRemaining, `rounds remaining`,
          // deck.cardIds.length, `cards left`)
          if (deck.cardIds.length < getPlayers().length) break
          forEach<Player>(`playersById`, p => {
            run(`DRAW`, { actorId: p.id, targets: { deckId } })
          })
          --roundsRemaining
        }
        return ({})
      },
    },

    DEAL_ALL: {
      domain: `Deck`,
      run: ({ targets }) => {
        // console.log(`DEAL_ALL`, targets)
        const { deckId } = targets as {deckId:CardGroupId}
        const deck = identify(deckId) as Deck
        return get().actions.DEAL.run({
          targets,
          options: { howMany: deck.cardIds.length },
        })
      },
    },

    DRAW: {
      domain: `Deck`,
      run: ({ actorId, targets }) => {
        if (!actorId) throw new Error(``)
        const { deckId } = targets as {deckId:CardGroupId}
        // console.log(`DRAW`, targets, actorId)
        const actor = identify(actorId) as Player | undefined
        const targetDeck = identify(deckId) as Deck | undefined
        if (!actor) throw new Error(``)
        if (!targetDeck) throw new Error(``)

        const handId = match<CardGroup>(
          `cardGroupId`,
          cardGroup => (
            cardGroup.ownerId === actorId
            && cardGroup.class === `Hand`
          )
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
    },

    MOVE: {
      domain: `System`,
      run: ({ targets, options }) => {
        const { originId, destinationId }
        = targets as {
          originId:CardGroupId,
          destinationId:CardGroupId}
        const { howMany, originIdx, destinationIdx }
        = options as Record<string, number>

        const origin: CardGroup = identify(originId)
        const destination = identify(destinationId) as CardGroup

        let cardIds

        const newOrigin = produce(
          origin,
          cardGroup => {
            cardIds = cardGroup.cardIds.splice(originIdx, howMany)
          }
        )
        const newDestination = produce(
          destination,
          cardGroup => {
            cardGroup.cardIds.splice(destinationIdx, 0, cardIds)
          }
        )

        return merge([newOrigin, newDestination]).into(`cardGroupsById`)
      },
    },

    PLACE: {
      domain: `System`,
      run: () => ({}),
    },

    SHUFFLE: {
      domain: `System`,
      run: () => {
        console.log(`shuffle`)
        return ({})
      },
    },
  })
}

export const installCoreActions
= (game:StoreApi<GameSession>)
: void => {
  game.setState(state => {
    state.actions = {
      ...state.actions,
      ...useCoreActions(game),
    }
  })
}

export default installCoreActions
