/** Temporary SPA bindings; upstream to @atom.io/realtime before release. */
import type {
	EventEmitter,
	RoomKey,
	RoomSocketInterface,
	Socket,
} from "@atom.io/realtime"
import { ownersOfRooms, roomKeysAtom, usersInRooms } from "@atom.io/realtime"
import * as RTC from "@atom.io/realtime/client"
import type { Accessor } from "@atom.io/spa"
import { onCleanup, onCommit, onMount, useGetter, useStore } from "@atom.io/spa"
import type {
	MutableAtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	ViewOf,
} from "atom.io"
import { getInternalRelations, selector } from "atom.io"
import type { Canonical } from "atom.io/foundations/canonical"
import type { Json } from "atom.io/foundations/json"
import type { RootStore, Transceiver } from "atom.io/internal"
import {
	findInStore,
	getInternalRelationsFromStore,
	setIntoStore,
} from "atom.io/internal"

import { leaseRealtimeService as lease } from "./realtime-services"
import { realtimeSocket } from "./socket-auth-service"

const [ownedRoomKeysAtoms] = getInternalRelations(ownersOfRooms, `split`)
const myOwnedRoomKeysSelector = selector<readonly RoomKey[]>({
	key: `myOwnedRoomKeys`,
	get: ({ get }) => {
		const user = get(RTC.myUserKeyAtom)
		return user ? Array.from(get(ownedRoomKeysAtoms, user)) : []
	},
})

function usePull(
	key: string,
	create: (store: RootStore, socket: Socket) => () => void,
): void {
	const store = useStore()
	onMount(() => {
		onCleanup(lease(store, `pull:${key}`, () => create(store, realtimeSocket)))
	})
}
export function useRealtimeConnection(): void {
	const store = useStore()
	onMount(() => {
		const connect = () => {
			setIntoStore(
				store,
				RTC.mySocketKeyAtom,
				realtimeSocket.id ? `socket::${realtimeSocket.id}` : undefined,
			)
		}
		const disconnect = () => {
			setIntoStore(store, RTC.mySocketKeyAtom, undefined)
		}
		connect()
		realtimeSocket.on(`connect`, connect)
		realtimeSocket.on(`disconnect`, disconnect)
		onCleanup(() => {
			realtimeSocket.off(`connect`, connect)
			realtimeSocket.off(`disconnect`, disconnect)
			disconnect()
		})
	})
}
export function usePullAtom<J extends Json.Serializable>(
	token: RegularAtomToken<J>,
): Accessor<ViewOf<J>> {
	usePull(token.key, (store, socket) => RTC.pullAtom(store, socket, token))
	return useGetter(token)
}
export function usePullSelector<T>(
	token: SelectorToken<T>,
): Accessor<ViewOf<T>> {
	usePull(token.key, (store, socket) => RTC.pullSelector(store, socket, token))
	return useGetter(token)
}
export function usePullMutable<T extends Transceiver<any, any, any>>(
	token: MutableAtomToken<T>,
): Accessor<ViewOf<T>> {
	usePull(token.key, (store, socket) =>
		RTC.pullMutableAtom(store, socket, token),
	)
	return useGetter(token)
}
export function usePullAtomFamilyMember<
	J extends Json.Serializable,
	K extends Canonical,
>(family: RegularAtomFamilyToken<J, K>, key: NoInfer<K>): Accessor<ViewOf<J>> {
	const token = findInStore(useStore(), family, key)
	usePull(token.key, (store, socket) =>
		RTC.pullAtomFamilyMember(store, socket, family, key),
	)
	return useGetter(token)
}
export function usePullSelectorFamilyMember<T, K extends Canonical>(
	family: SelectorFamilyToken<T, K>,
	key: NoInfer<K>,
): Accessor<ViewOf<T>> {
	const token = findInStore(useStore(), family, key)
	usePull(token.key, (store, socket) =>
		RTC.pullSelectorFamilyMember(store, socket, family, key),
	)
	return useGetter(token)
}
export function useRealtimeRooms<
	RoomNames extends string = string,
>(): RealtimeRoomsTools<RoomNames> {
	const store = useStore()
	const getRoomKeys = usePullMutable(roomKeysAtom)
	const getUserKey = usePullAtom(RTC.myUserKeyAtom)
	const getRoomKey = useGetter(RTC.myRoomKeySelector)
	const [users, rooms] = getInternalRelationsFromStore(
		store,
		usersInRooms,
		`split`,
	)
	const [owned, owners] = getInternalRelationsFromStore(
		store,
		ownersOfRooms,
		`split`,
	)
	// Each subscription follows its own identity; SPA owns replacement and cleanup.
	onCommit(getUserKey, (user) => {
		if (!user) return
		const releaseRooms = lease(
			store,
			`pull:${findInStore(store, rooms, user).key}`,
			() => RTC.pullMutableAtomFamilyMember(store, realtimeSocket, rooms, user),
		)
		const releaseOwned = lease(
			store,
			`pull:${findInStore(store, owned, user).key}`,
			() => RTC.pullMutableAtomFamilyMember(store, realtimeSocket, owned, user),
		)
		return () => {
			releaseRooms()
			releaseOwned()
		}
	})
	onCommit(getRoomKey, (room) => {
		if (!room) return
		const releaseUsers = lease(
			store,
			`pull:${findInStore(store, users, room).key}`,
			() => RTC.pullMutableAtomFamilyMember(store, realtimeSocket, users, room),
		)
		const releaseOwners = lease(
			store,
			`pull:${findInStore(store, owners, room).key}`,
			() => RTC.pullMutableAtomFamilyMember(store, realtimeSocket, owners, room),
		)
		return () => {
			releaseUsers()
			releaseOwners()
		}
	})

	return {
		roomSocket: realtimeSocket,
		myRoomKey: getRoomKey,
		myOwnedRoomKeys: useGetter(myOwnedRoomKeysSelector),
		allRoomKeys: () => Array.from(getRoomKeys()),
	}
}
export type RealtimeRoomsTools<RoomNames extends string> = {
	roomSocket: Socket & { emit: EventEmitter<RoomSocketInterface<RoomNames>> }
	myRoomKey: Accessor<RoomKey | null>
	myOwnedRoomKeys: Accessor<readonly RoomKey[]>
	allRoomKeys: Accessor<RoomKey[]>
}
