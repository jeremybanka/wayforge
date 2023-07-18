import { Join } from "~/packages/anvl/src/join"
import { parseJson, stringifyJson } from "~/packages/anvl/src/json"
import { hasExactProperties } from "~/packages/anvl/src/object"

import { persistStringSetAtom } from "./explorer-effects"
import type { AtomToken, ReadonlySelectorFamily } from ".."
import { SelectorFamily, selectorFamily } from ".."
import type { AtomFamily } from "../atom"
import { atom, atomFamily } from "../atom"
import { lazyLocalStorageEffect, persistAtom } from "../web-effects"

export const makeSpaceIndex = (key: string): AtomToken<Set<string>> =>
	atom<Set<string>>({
		key: `${key}:space_index`,
		default: new Set([`root`]),
		effects: [persistStringSetAtom(`${key}:space_index`)],
	})

export const makeSpaceLayoutState = (
	key: string,
): AtomToken<Join<{ size: number }, `parent`, `child`>> =>
	atom({
		key: `${key}:space_layout`,
		default: new Join({ relationType: `1:n` }),
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
	spaceLayoutState: AtomToken<Join<{ size: number }, `parent`, `child`>>,
): ReadonlySelectorFamily<{ childSpaceIds: string[]; size: number }, string> =>
	selectorFamily<{ childSpaceIds: string[]; size: number }, string>({
		key: `${key}:explorer_space`,
		get: (me) => ({ get }) => {
			const join = get(spaceLayoutState)
			const myFollowers = join.getRelatedIds(`parent:${me}`)
			const myLeader = join.getRelatedId(me)
			const { size } = myLeader
				? join.getContent(myLeader, me) ?? { size: NaN }
				: { size: NaN }
			return { childSpaceIds: myFollowers, size }
		},
	})

export const makeSpaceFamily = (key: string): AtomFamily<number, string> =>
	atomFamily<number, string>({
		key: `${key}:space`,
		default: 1,
		effects: (subKey) => [lazyLocalStorageEffect(`${key}:${subKey}`)],
	})
