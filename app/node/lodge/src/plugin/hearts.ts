// import produce from "immer"
/* eslint-disable max-len */
import { StoreApi } from "zustand/vanilla"
import { GameSession } from "../store/game"
import {
  IAction,
} from "../core/actions/types"
import installCoreActions from "../core/actions"
import { frenchPlayingCardDeck } from "./PlayingCard"
import { CardGroup, Player, Zone } from "../core/models"

export const useHeartsActions
= (game:StoreApi<GameSession>)
: Record<string, IAction> => {
  installCoreActions(game)
  const get = () => game.getState()
  const getAllCardValueIds = () => Object.values(get().cardValuesById)
    .map(cardValue => cardValue.id)
  return {
    INIT: {
      domain: `System`,
      run: () => {
        const { every, forEach, match, run, target } = get()

        run(`CLEAR_TABLE`, {})
        run(`CREATE_CARD_VALUES`, { options: { values: frenchPlayingCardDeck } })
        run(`CREATE_ZONE_LAYOUT`, { options: { id: `main-layout` } })
        run(`CREATE_ZONE`, {
          options: { id: `main-deck-zone`, contentType: `Deck` },
          targets: target(`zoneLayoutId`, `main-layout`),
        })
        run(`CREATE_ZONE`, {
          options: { id: `main-trick-zone` },
          targets: target(`zoneLayoutId`, `main-layout`),
        })
        run(`CREATE_DECK`, {
          options: { id: `main-deck` },
          targets: { ...target(`zoneId`, `main-deck-zone`), cardValueIds: getAllCardValueIds() },
        })
        forEach<Player>(`playersById`, p => {
          const idString = p.id.toString()
          const zoneLayoutIdStr = `${idString}-zoneLayout`
          const pileZoneIdStr = `${idString}-pile-zone`
          const pileIdStr = `${idString}-pile`
          run(`CREATE_HAND`, {
            targets: { ownerId: p.id },
          })
          run(`CREATE_ZONE_LAYOUT`, {
            options: { id: zoneLayoutIdStr },
            targets: { ownerId: p.id },
          })
          run(`CREATE_ZONE`, {
            options: { id: pileZoneIdStr, contentType: `Pile` },
            targets: { ownerId: p.id, ...target(`zoneLayoutId`, zoneLayoutIdStr) },
          })
          run(`CREATE_PILE`, {
            options: { id: pileIdStr },
            targets: { ownerId: p.id, ...target(`zoneId`, pileZoneIdStr) },
          })
        })
        run(`CREATE_CARD_CYCLE`, {
          options: { id: `main-cycle`, phaseNames: [0, 1, 2, 3] },
          targets: {
            0: match<CardGroup>(`cardGroupId`, `main-deck`),
            1: every<Player>(`playerId`, () => true),
            2: match<Zone>(`zoneId`, `main-trick-zone`),
            3: every<Zone>(`zoneId`, zone => (!!zone.ownerId && zone.contentType === `Pile`)),
          },
        })
        run(`DEAL_ALL`, { targets: { deckId: match(`cardGroupId`, `main-deck`) } })
        return ({})
      },
    },

  }
}

export const hearts = {
  name: `Hearts`,
  description:
    `The classic trick-taking game where points are bad...until they're not!`,
  useHeartsActions,
}

export const installHeartsActions
= (game:StoreApi<GameSession>)
: void => {
  const heartsActions = useHeartsActions(game)
  game.setState(state => {
    state.actions = {
      ...state.actions,
      ...heartsActions,
    }
  })
}

export default installHeartsActions
