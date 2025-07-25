import type { Encapsulate } from "anvl/function"
import type { ErrorObject } from "anvl/json-api"
import { hasExactProperties } from "anvl/object"
import { isString } from "fp-ts/string"
import type { SimpleGit } from "simple-git"

export const SIMPLE_GIT_FUNCTIONS_INACCESSIBLE_OVER_SOCKET = [
	`clearQueue`,
	`customBinary`,
	`env`,
	`silent`,
	`outputHandler`,
] as const

export type GitSocketError = ErrorObject<`title`>

export const isGitSocketError = (value: unknown): value is GitSocketError =>
	hasExactProperties({
		type: (a: unknown): a is `error` => `error` === a,
		title: isString,
	})(value)

export type GitInterface = Omit<
	SimpleGit,
	(typeof SIMPLE_GIT_FUNCTIONS_INACCESSIBLE_OVER_SOCKET)[number]
>

// server "on" / client "emit"
export type GitClientEvents = {
	[GitFunction in keyof GitInterface]: Encapsulate<GitInterface[GitFunction]>
}

/* prettier-ignore */
// server "emit" / client "on"
export type GitServerEvents = {
	[GitFunction in keyof GitInterface]: GitInterface[GitFunction] extends (
		...args: any[]
	) => any
		? (
				result: Awaited<ReturnType<GitInterface[GitFunction]>> | GitSocketError,
			) => void
		: never
}

export type GitServerSideEvents = Record<string, unknown>
