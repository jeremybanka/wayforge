import {
	atom,
	atomFamily,
	getInternalRelations,
	mutableAtom,
	selector,
} from "atom.io"
import { type UserKey, usersInRooms } from "atom.io/realtime"
import { myRoomKeySelector, usersHereSelector } from "atom.io/realtime-client"
import { OList } from "atom.io/transceivers/o-list"

export type TurnBasedGameActions = {
	wantFirst: () => void
	wantNotFirst: () => void
	startGame: () => void
}

export const playerTurnOrderAtom = mutableAtom<OList<UserKey>>({
	key: `playerTurnOrder`,
	class: OList,
})

export const spectatorsSelector = selector<UserKey[]>({
	key: `spectators`,
	get: ({ get }) => {
		const order = get(playerTurnOrderAtom)
		const myRoomKey = get(myRoomKeySelector)
		const spectators: UserKey[] = []
		if (!myRoomKey) return spectators
		const [usersInRoomsAtoms] = getInternalRelations(usersInRooms, `split`)
		const usersHere = get(usersInRoomsAtoms, myRoomKey)
		for (const key of usersHere) if (!order.includes(key)) spectators.push(key)
		return spectators
	},
})

export const turnNumberAtom = atom<number>({
	key: `turnNumber`,
	default: 0,
})

export const playerTurnSelector = selector<UserKey | null>({
	key: `playerTurn`,
	get: ({ get }) => {
		const turnNumber = get(turnNumberAtom)
		const playerTurnOrder = get(playerTurnOrderAtom)
		if (playerTurnOrder.length === 0) return null
		const index = turnNumber % playerTurnOrder.length
		return playerTurnOrder[index]
	},
})

export type PlayerReadyStatus =
	| `notReady`
	| `readyDoesNotWantFirst`
	| `readyWantsFirst`
export const playerReadyStatusAtoms = atomFamily<PlayerReadyStatus, UserKey>({
	key: `playerReadyStatus`,
	default: `notReady`,
})

export type GameState = `playing` | `recap` | `setup`
export const gameStateAtom = atom<GameState>({
	key: `gameState`,
	default: `setup`,
})

export const setupGroupsSelector = selector<
	Record<PlayerReadyStatus, UserKey[]>
>({
	key: `setupGroups`,
	get: ({ get }) => {
		const notReady: UserKey[] = []
		const readyDoesNotWantFirst: UserKey[] = []
		const readyWantsFirst: UserKey[] = []
		const turnOrder = get(playerTurnOrderAtom)
		const roomKey = get(myRoomKeySelector)
		if (!roomKey) {
			return { notReady, readyDoesNotWantFirst, readyWantsFirst }
		}
		const usersHere = get(usersHereSelector)
		if (usersHere === null) {
			return { notReady, readyDoesNotWantFirst, readyWantsFirst }
		}
		for (const userKey of usersHere) {
			const playerReadyStatus = get(playerReadyStatusAtoms, userKey)
			if (turnOrder.includes(userKey)) continue
			switch (playerReadyStatus) {
				case `notReady`:
					notReady.push(userKey)
					break
				case `readyDoesNotWantFirst`:
					readyDoesNotWantFirst.push(userKey)
					break
				case `readyWantsFirst`:
					readyWantsFirst.push(userKey)
					break
			}
		}
		return { notReady, readyDoesNotWantFirst, readyWantsFirst }
	},
})
