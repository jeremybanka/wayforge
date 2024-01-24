import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	actUponStore,
	findInStore,
	getFromStore,
	setIntoStore,
	subscribeToTimeline,
	subscribeToTransaction,
} from "atom.io/internal"

import type { Json, JsonIO } from "atom.io/json"
import type { ServerConfig } from "../../realtime-server/src"
import { usersOfSockets } from "../../realtime-server/src"
import {
	completeUpdateAtoms,
	socketEpochSelectors,
	socketUnacknowledgedUpdatesSelectors,
} from "../../realtime-server/src/realtime-server-stores/server-sync-store"
import type { SyncGroupToken } from "./create-realtime-sync-group"
import { redactedPerspectiveUpdateSelectors } from "./realtime-sync-group-store"

export function realtimeContinuitySynchronizer({
	socket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function synchronizer(
		timeline: AtomIO.TimelineToken<AtomIO.TimelineManageable>,
	): void {
		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = getFromStore(userKeyState, store)
		if (!userKey) {
			store.logger.error(
				`❌`,
				timeline.type,
				timeline.key,
				`Tried to create a synchronizer for a socket that is not connected to a user.`,
			)
			return
		}

		const unsubscribeFromTimeline = subscribeToTimeline(
			timeline,
			(timelineUpdate) => {
				if (timelineUpdate === `redo` || timelineUpdate === `undo`) {
					return
				}
				if (timelineUpdate.type !== `transaction_update`) {
					return
				}
			},
			`realtime-continuity-synchronizer`,
			store,
		)
	}
}

// continuities
//
// let's say I'm running a server in IPC mode
//
// I have 1 "operator" server responsible for
// - user authentication
// - creation and destruction of rooms
// - user assignment to rooms
// and I have X "room" servers responsible for
// - taking action parameters as input, and applying them to the room state
// - outputting the results of actions tagged by the id of the action
// and I have Y "user" clients responsible for
// - sending action params to the operator server
// - receiving action results from the operator server
// - reconciling the action results with the local state
//
// thing is, there is an asymmetry between the server-side and client-side
// - server-side, there are two stores
// - client-side, there is only one store
// action synchronization relies on the EPOCH NUMBER
// - a global set on the store
// - represents the number of actions that have been applied to the store
//
// so where
// A is the operator epoch,
// and B is a room's epoch,
// and C is the epoch of a user of that room
// C = A + B
//
// without a notion of separate continuities, this is a fundamental impasse
// the client will receive action results tagged with an epoch number that is not correct to its store
//
// to fix this
// - epoch store implementation must change from `number` to `Record<string, number>`
// - epoch transport does not change, remains `number`
// - any given action must be assignable to a continuity
