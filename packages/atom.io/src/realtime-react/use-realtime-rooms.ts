import type { MutableAtomToken } from "atom.io"
import { findInStore, getInternalRelationsFromStore } from "atom.io/internal"
import { StoreContext, useO } from "atom.io/react"
import type { RoomKey, RoomSocketInterface, UserKey } from "atom.io/realtime"
import { ownersOfRooms, roomKeysAtom, usersInRooms } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import type { UList } from "atom.io/transceivers/u-list"
import * as React from "react"
import type { Socket } from "socket.io-client"

import { RealtimeContext } from "./realtime-context"
import { usePullAtom } from "./use-pull-atom"
import { usePullMutable } from "./use-pull-mutable-atom"
import { usePullMutableAtomFamilyMember } from "./use-pull-mutable-family-member"

export type RealtimeRoomsTools = {
	roomSocket: Socket<{}, RoomSocketInterface<string>>
	myRoomKey: RoomKey | undefined
	myMutualsAtom: MutableAtomToken<UList<UserKey>>
	myOwnedRoomsAtom: MutableAtomToken<UList<RoomKey>>
	allRoomKeysAtom: MutableAtomToken<UList<RoomKey>>
}
export function useRealtimeRooms<
	RoomNames extends string,
>(): RealtimeRoomsTools {
	const store = React.useContext(StoreContext)
	const { socket } = React.useContext(RealtimeContext)
	usePullMutable(roomKeysAtom)
	const userKey = usePullAtom(myUserKeyAtom) ?? `user::$_NONE_$`

	const [userKeysFamily, roomKeysFamily] = getInternalRelationsFromStore(
		store,
		usersInRooms,
		`split`,
	)
	usePullMutableAtomFamilyMember(roomKeysFamily, userKey)

	const myJoinedRoomKeys = useO(roomKeysFamily, userKey)
	let myRoomKey: RoomKey | undefined
	for (const roomKey of myJoinedRoomKeys) {
		myRoomKey = roomKey
		break
	}
	const roomKey = myRoomKey ?? `room::$_NONE_$`
	const myMutualsAtom = findInStore(store, userKeysFamily, roomKey)
	usePullMutableAtomFamilyMember(userKeysFamily, roomKey)

	const [ownedRoomsFamily, roomOwnersFamily] = getInternalRelationsFromStore(
		store,
		ownersOfRooms,
		`split`,
	)
	const myOwnedRoomsAtom = findInStore(store, ownedRoomsFamily, userKey)
	usePullMutableAtomFamilyMember(ownedRoomsFamily, userKey)
	usePullMutableAtomFamilyMember(roomOwnersFamily, roomKey)

	return {
		roomSocket: socket as Socket<{}, RoomSocketInterface<RoomNames>>,
		myRoomKey,
		allRoomKeysAtom: roomKeysAtom,
		myMutualsAtom,
		myOwnedRoomsAtom,
	}
}
