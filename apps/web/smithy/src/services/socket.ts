import type { RecoilValueReadOnly } from "recoil"
import { atom, selector } from "recoil"
import type { Socket } from "socket.io-client"
import { io } from "socket.io-client"

import type {
	Clientele,
	ClienteleError,
} from "~/apps/node/forge/src/services/clientele"

export const socket = io(`http://localhost:3333/`)

export type ClienteleUser = Socket<
	Clientele[`ServerEvents`],
	Clientele[`ClientEvents`]
>

export const initConnectionState = (
	s: ClienteleUser,
): RecoilValueReadOnly<
	ClienteleError | `Connected` | `Disconnected` | `Searching`
> => {
	const connectionState_INTERNAL = atom<
		ClienteleError | `Connected` | `Disconnected` | `Searching`
	>({
		key: `connection_INTERNAL`,
		default: `Searching`,
		effects: [
			({ setSelf }) => {
				s.on(`connection`, () => {
					console.log(`Connected`)
					setSelf(`Connected`)
				})
			},
		],
	})
	return selector<ClienteleError | `Connected` | `Disconnected` | `Searching`>({
		key: `connection`,
		get: ({ get }) => get(connectionState_INTERNAL),
	})
}

export const connectionState = initConnectionState(socket)
