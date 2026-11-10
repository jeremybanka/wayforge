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
import { onCleanup, onMount, useGetter, useId, useStore } from "@atom.io/spa"
import { bindScene } from "@atom.io/spa/renderer"
import type {
	MutableAtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	ViewOf,
} from "atom.io"
import type { Canonical } from "atom.io/foundations/canonical"
import type { Json } from "atom.io/foundations/json"
import type { RootStore, Transceiver } from "atom.io/internal"
import {
	createReadonlyPureSelector,
	disposeFromStore,
	findInStore,
	getInternalRelationsFromStore,
	setIntoStore,
} from "atom.io/internal"

import { leaseRealtimeService as lease } from "./realtime-services"
import { realtimeSocket } from "./socket-auth-service"
import { useMutable } from "./spa-state"

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
	usePullMutable(roomKeysAtom)
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
	// Keyed child views remount on identity changes; these leases also serve persistent views.
	let release = () => {}
	onCleanup(() => {
		release()
	})
	bindScene(
		() => [getUserKey(), getRoomKey()] as const,
		([user, room]) => {
			const previous = release
			const userKey = user ?? `user::$_NONE_$`
			const roomKey = room ?? `room::$_NONE_$`
			const releases = [
				lease(store, `pull:${findInStore(store, rooms, userKey).key}`, () =>
					RTC.pullMutableAtomFamilyMember(store, realtimeSocket, rooms, userKey),
				),
				lease(store, `pull:${findInStore(store, owned, userKey).key}`, () =>
					RTC.pullMutableAtomFamilyMember(store, realtimeSocket, owned, userKey),
				),
				lease(store, `pull:${findInStore(store, users, roomKey).key}`, () =>
					RTC.pullMutableAtomFamilyMember(store, realtimeSocket, users, roomKey),
				),
				lease(store, `pull:${findInStore(store, owners, roomKey).key}`, () =>
					RTC.pullMutableAtomFamilyMember(
						store,
						realtimeSocket,
						owners,
						roomKey,
					),
				),
			]
			previous()
			release = () => {
				releases.forEach((dispose) => {
					dispose()
				})
			}
		},
	)

	const ownedToken = createReadonlyPureSelector<
		readonly RoomKey[],
		never,
		never
	>(
		store,
		{
			key: `tempest:ownedRooms:${useId()}`,
			get: ({ get }) =>
				Array.from(get(owned, get(RTC.myUserKeyAtom) ?? `user::$_NONE_$`)),
		},
		undefined,
	)
	onCleanup(() => {
		disposeFromStore(store, ownedToken)
	})

	return {
		roomSocket: realtimeSocket,
		myRoomKey: getRoomKey,
		myOwnedRoomKeys: useGetter(ownedToken),
		allRoomKeys: useMutable(roomKeysAtom),
	}
}
export type RealtimeRoomsTools<RoomNames extends string> = {
	roomSocket: Socket & { emit: EventEmitter<RoomSocketInterface<RoomNames>> }
	myRoomKey: Accessor<RoomKey | null>
	myOwnedRoomKeys: Accessor<readonly RoomKey[]>
	allRoomKeys: Accessor<RoomKey[]>
}
