import type { Socket } from "socket.io-client"

import { recordToEntries } from "~/packages/anvl/src/object/entries"
import { capitalize } from "~/packages/anvl/src/string/capitalize"
import * as A_IO from "~/packages/atom.io/src/main"

import { DEFAULT_SIMPLE_GIT_RETURN_VALUES } from "./defaults"
import type {
	GitClientEvents,
	GitInterface,
	GitServerEvents,
	GitSocketError,
} from "./interface"

export * from "./interface"

export type GitClientSocket = Socket<GitServerEvents, GitClientEvents>

export type GitClientTools = {
	[GitFunction in keyof GitInterface]: GitInterface[GitFunction] extends (
		...args: any[]
	) => any
		? {
				(...args: Parameters<GitInterface[GitFunction]>): void
				state: A_IO.ReadonlyPureSelectorToken<
					Awaited<ReturnType<GitInterface[GitFunction]>> | GitSocketError
				>
				getCurrentState: A_IO.Read<
					() => Awaited<ReturnType<GitInterface[GitFunction]>> | GitSocketError
				>
			}
		: never
}

export const initGitAtomicTools = (socket: GitClientSocket): GitClientTools => {
	const completeInterface = {} as GitClientTools

	const makeClientInterface = (key: keyof GitInterface) => {
		const internalState = A_IO.atom<any>({
			key: `git${capitalize(key)}_INTERNAL`,
			default: DEFAULT_SIMPLE_GIT_RETURN_VALUES[key],
			effects: [
				({ setSelf }) => {
					socket.on(key, (result: unknown) => {
						setSelf(result)
					})
				},
			],
		})
		const getInternalState: A_IO.Read<() => any> = ({ get }) =>
			get(internalState)
		const clientInterface = Object.assign(
			(...args: Parameters<GitInterface[keyof GitInterface]>) =>
				socket.emit(key, ...args),
			{
				state: A_IO.selector<any>({
					key: `git${capitalize(key)}`,
					get: ({ get }) => get(internalState),
				}),
				getCurrentState: getInternalState,
			},
		)
		return clientInterface
	}
	for (const [key] of recordToEntries(DEFAULT_SIMPLE_GIT_RETURN_VALUES)) {
		completeInterface[key] = makeClientInterface(key)
	}
	return completeInterface
}
