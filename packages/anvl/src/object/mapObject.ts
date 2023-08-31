import { pipe } from "fp-ts/function"

import { map } from "../array"
import { entriesToRecord, recordToEntries } from "./entries"

export const mapObject = <K extends keyof any, I, O>(
	obj: Record<K, I>,
	fn: (val: I, key: K) => O,
): Record<K, O> =>
	pipe(
		obj,
		recordToEntries,
		map(([key, val]) => [key, fn(val, key)] as const),
		entriesToRecord,
	)

export const mob =
	<K extends keyof any, I, O>(fn: (val: I, key: K) => O) =>
	(obj: Record<K, I>): Record<K, O> =>
		mapObject(obj, fn)
