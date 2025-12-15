import type { MutableAtomToken } from "atom.io"
import { findInStore, getInternalRelationsFromStore } from "atom.io/internal"
import { StoreContext, useO } from "atom.io/react"
import type { RoomKey, RoomSocketInterface, UserKey } from "atom.io/realtime"
import { ownersOfRooms, roomKeysAtom, usersInRooms } from "atom.io/realtime"
import type { UList } from "atom.io/transceivers/u-list"
import * as React from "react"
import type { Socket } from "socket.io-client"

import { RealtimeContext } from "./realtime-context"
import { usePullMutable } from "./use-pull-mutable-atom"
import { usePullMutableAtomFamilyMember } from "./use-pull-mutable-family-member"

export type RealtimeRoomsTools = {
	socket: Socket<{}, RoomSocketInterface<string>>
	myRoomKey: RoomKey
	myMutualsAtom: MutableAtomToken<UList<UserKey>>
	myOwnedRoomsAtom: MutableAtomToken<UList<RoomKey>>
	allRoomKeysAtom: MutableAtomToken<UList<RoomKey>>
}
export function useRealtimeRooms<RoomNames extends string>(
	userKey: UserKey,
): RealtimeRoomsTools {
	const store = React.useContext(StoreContext)
	const { socket } = React.useContext(RealtimeContext)
	usePullMutable(roomKeysAtom)

	const [userKeysFamily, roomKeysFamily] = getInternalRelationsFromStore(
		store,
		usersInRooms,
		`split`,
	)

	usePullMutableAtomFamilyMember(roomKeysFamily, userKey)
	const myJoinedRoomKeys = useO(roomKeysFamily, userKey)
	let myRoomKey: RoomKey = `room::$_NONE_$`
	for (const roomKey of myJoinedRoomKeys) {
		myRoomKey = roomKey
		break
	}
	usePullMutableAtomFamilyMember(userKeysFamily, myRoomKey)

	const [ownedRoomsFamily] = getInternalRelationsFromStore(
		store,
		ownersOfRooms,
		`split`,
	)
	const myOwnedRoomsAtom = findInStore(store, ownedRoomsFamily, userKey)
	usePullMutableAtomFamilyMember(ownedRoomsFamily, userKey)

	return {
		socket: socket as Socket<{}, RoomSocketInterface<RoomNames>>,
		myRoomKey: myRoomKey,
		allRoomKeysAtom: roomKeysAtom,
		myMutualsAtom: findInStore(store, userKeysFamily, myRoomKey),
		myOwnedRoomsAtom,
	}
}
