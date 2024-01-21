import type { ChildProcessWithoutNullStreams } from "child_process"
import { spawn } from "child_process"

import * as AtomIO from "atom.io"
import type { Loadable } from "atom.io/data"
import { join } from "atom.io/data"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export type RoomArguments =
	| [script: string, options: string[]]
	| [script: string]

export const roomIndex = AtomIO.atom({
	key: `roomIndex`,
	default: () => new SetRTX<string>(),
	mutable: true,
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export type UserInRoomMeta = {
	enteredAtEpoch: number
}
export const DEFAULT_USER_IN_ROOM_META: UserInRoomMeta = {
	enteredAtEpoch: 0,
}
export const usersInRooms = join(
	{
		key: `usersInRooms`,
		between: [`room`, `user`],
		cardinality: `1:n`,
	},
	DEFAULT_USER_IN_ROOM_META,
)

export const roomArgumentsAtoms = AtomIO.atomFamily<RoomArguments, string>({
	key: `roomArguments`,
	default: [`echo Hello World!`],
})

export const roomSelectors = AtomIO.selectorFamily<
	Loadable<ChildProcessWithoutNullStreams>,
	string
>({
	key: `room`,
	get:
		(roomId) =>
		({ get, find }) => {
			const argumentsState = find(roomArgumentsAtoms, roomId)
			const args = get(argumentsState)
			const [script, options] = args
			return new Promise((resolve) => {
				const room = spawn(script, options, {
					env: {
						...process.env,
						PORT: `${6260}`,
					},
				})
				room.stdout.on(`data`, (data) => {
					console.log(`[Server ${roomId}] ${data}`)
					if (data.toString() === `✨`) {
						resolve(room)
					}
				})
				room.stderr.on(`data`, (data) => {
					console.error(`[Server ${roomId} Error] ${data}`)
				})
			})
		},
})

export const createRoomTX = AtomIO.transaction<
	(
		roomId: string,
		script: string,
		options?: string[],
	) => Loadable<ChildProcessWithoutNullStreams>
>({
	key: `createRoom`,
	do: ({ get, set, find }, roomId, script, options) => {
		const args: RoomArguments = options ? [script, options] : [script]
		const roomArgumentsState = find(roomArgumentsAtoms, roomId)
		set(roomArgumentsState, args)
		set(roomIndex, (s) => s.add(roomId))
		const roomState = find(roomSelectors, roomId)
		const room = get(roomState)
		return room
	},
})
export type CreateRoomIO = AtomIO.TransactionIO<typeof createRoomTX>
