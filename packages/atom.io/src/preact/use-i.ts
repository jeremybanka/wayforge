import type { WritableFamilyToken, WritableToken } from "atom.io"
import { IMPLICIT, setIntoStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useRef } from "preact/hooks"

import { parseStateOverloads } from "./parse-state-overloads"

export function useI<T>(
	token: WritableToken<T, any, any>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical>(
	token: WritableFamilyToken<T, K, any>,
	key: NoInfer<K>,
): <New extends T>(next: New | ((old: T) => New)) => void

export function useI<T, K extends Canonical>(
	...params:
		| [WritableFamilyToken<T, K, any>, NoInfer<K>]
		| [WritableToken<T, any, any>]
): <New extends T>(next: New | ((old: T) => New)) => void {
	const token = parseStateOverloads(IMPLICIT.STORE, ...params)
	const setter: React.RefObject<
		(<New extends T>(next: New | ((old: T) => New)) => void) | null
	> = useRef(null)
	setter.current ??= (next) => {
		setIntoStore(IMPLICIT.STORE, token, next)
	}
	return setter.current
}
