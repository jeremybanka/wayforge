import { Join } from "anvl/join"
import * as v from "vitest"

import type { EmptyObject } from "~/packages/anvl/src/object"
import { isEmptyObject } from "~/packages/anvl/src/object"
import { SetRTX } from "~/packages/atom.io/transceivers/set-rtx/src"
import { Junction } from "~/packages/rel8/junction/src"

v.describe(`constructor`, () => {
	v.bench(`new Set`, () => {
		new Set()
	})
	v.bench(`new SetRTX`, () => {
		new SetRTX()
	})
})

v.describe(`adding values`, () => {
	const set = new Set()
	const setRTX = new SetRTX()
	v.bench(`set.add`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			set.add(char)
		}
	})
	v.bench(`setRTX.add`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			setRTX.add(char)
		}
	})
})

v.describe(`Set: constructing with many values vs adding many values`, () => {
	const set = new Set()
	v.bench(`set.add`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			set.add(char)
		}
	})
	v.bench(`set constructor`, () => {
		new Set(`abcdefghijklmnopqrstuvwxyz`)
	})
})

v.describe(`SetRTX: constructing with many values vs adding many values`, () => {
	const setRTX = new SetRTX()
	v.bench(`setRTX.add`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			setRTX.add(char)
		}
	})
	v.bench(`setRTX constructor`, () => {
		new SetRTX(`abcdefghijklmnopqrstuvwxyz`)
	})
})
