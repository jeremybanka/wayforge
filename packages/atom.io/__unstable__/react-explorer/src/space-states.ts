import { atom, atomFamily, selectorFamily } from "atom.io"
import type {
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyToken,
	RegularAtomFamily,
	RegularAtomFamilyToken,
	RegularAtomToken,
} from "atom.io"
import { parseJson, stringifyJson } from "atom.io/json"
import {
	lazyLocalStorageEffect,
	persistAtom,
} from "~/packages/atom.io/__unstable__/web-effects/src"

import { Join } from "~/packages/anvl/src/join"
import { hasExactProperties } from "~/packages/anvl/src/object"

import { persistStringSetAtom } from "./explorer-effects"

export const makeSpaceIndex = (key: string): RegularAtomToken<Set<string>> =>
	atom<Set<string>>({
		key: `${key}:space_index`,
		default: new Set([`root`]),
		effects: [persistStringSetAtom(`${key}:space_index`)],
	})

export const makeSpaceLayoutState = (
	key: string,
): RegularAtomToken<Join<{ size: number }, `parent`, `child`>> =>
	atom({
		key: `${key}:space_layout`,
		default: new Join<{ size: number }>({ relationType: `1:n` })
			.from(`parent`)
			.to(`child`),
		effects: [
			persistAtom<Join<{ size: number }, `parent`, `child`>>(localStorage)({
				stringify: (join) => stringifyJson(join.toJSON()),
				parse: (string) => {
					try {
						const json = parseJson(string)
						const join = Join.fromJSON(json, {
							isContent: hasExactProperties({
								size: (v): v is number => typeof v === `number`,
							}),
							from: `parent`,
							to: `child`,
						})
						return join
					} catch (thrown) {
						console.error(`Error parsing spaceLayoutState from localStorage`)
						return new Join({ relationType: `1:n` })
					}
				},
			})(`${key}:space_layout`),
		],
	})

export const makeSpaceLayoutNodeFamily = (
	key: string,
	spaceLayoutState: RegularAtomToken<Join<{ size: number }, `parent`, `child`>>,
): ReadonlySelectorFamilyToken<
	{ childSpaceIds: string[]; size: number },
	string
> =>
	selectorFamily<{ childSpaceIds: string[]; size: number }, string>({
		key: `${key}:explorer_space`,
		get:
			(me) =>
			({ get }) => {
				const join = get(spaceLayoutState)
				const myFollowers = join.getRelatedIds(`parent:${me}`)
				const myLeader = join.getRelatedId(me)
				const { size } = myLeader
					? join.getContent(myLeader, me) ?? { size: NaN }
					: { size: NaN }
				return { childSpaceIds: myFollowers, size }
			},
	})

export const makeSpaceFamily = (
	key: string,
): RegularAtomFamilyToken<number, string> =>
	atomFamily<number, string>({
		key: `${key}:space`,
		default: 1,
		effects: (subKey) => [lazyLocalStorageEffect(`${key}:${subKey}`)],
	})
