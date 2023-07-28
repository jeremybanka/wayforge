import { isPlainObject } from "~/packages/anvl/src/object"
import { Refinery } from "~/packages/anvl/src/refinement/refinery"
import {
	diffArray,
	diffBoolean,
	diffNumber,
	diffObject,
	diffString,
	Differ,
} from "~/packages/anvl/src/tree/differ"

import { atom, atomFamily } from ".."
import { attachIntrospectionStates } from "../introspection"
import { lazyLocalStorageEffect } from "../web-effects"

export * from "./AtomIODevtools"

export const {
	atomIndex,
	selectorIndex,
	transactionIndex,
	findTransactionLogState,
	timelineIndex,
	findTimelineState,
} = attachIntrospectionStates()

export const devtoolsAreOpenState = atom<boolean>({
	key: `👁‍🗨 Devtools Are Open`,
	default: true,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools Are Open`)],
})

type DevtoolsView = `atoms` | `selectors` | `timelines` | `transactions`

export const devtoolsViewSelectionState = atom<DevtoolsView>({
	key: `👁‍🗨 Devtools View Selection`,
	default: `atoms`,
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools View`)],
})

export const devtoolsViewOptionsState = atom<DevtoolsView[]>({
	key: `👁‍🗨 Devtools View Options`,
	default: [`atoms`, `selectors`, `transactions`, `timelines`],
	effects: [lazyLocalStorageEffect(`👁‍🗨 Devtools View Options`)],
})

export const findViewIsOpenState = atomFamily<boolean, string>({
	key: `👁‍🗨 Devtools View Is Open`,
	default: false,
	effects: (key) => [lazyLocalStorageEffect(key + `:view-is-open`)],
})

export const primitiveRefinery = new Refinery({
	number: (input: unknown): input is number => typeof input === `number`,
	string: (input: unknown): input is string => typeof input === `string`,
	boolean: (input: unknown): input is boolean => typeof input === `boolean`,
	null: (input: unknown): input is null => input === null,
})

export const jsonTreeRefinery = new Refinery({
	object: isPlainObject,
	array: (input: unknown): input is unknown[] => Array.isArray(input),
})

export const prettyJson = new Differ(primitiveRefinery, jsonTreeRefinery, {
	number: diffNumber,
	string: diffString,
	boolean: diffBoolean,
	null: () => ({ summary: `No Change` }),
	object: diffObject,
	array: diffArray,
})
