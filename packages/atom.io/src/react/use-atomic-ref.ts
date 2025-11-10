import type { RegularAtomToken } from "atom.io"
import { setState } from "atom.io"
import { useEffect } from "react"

export function useAtomicRef<T, R extends { current: T | null }>(
	token: RegularAtomToken<T | null>,
	useRef: <TT>(initialValue: TT | null) => R,
): R {
	const ref = useRef(null)
	useEffect(() => {
		setState(token, ref.current)
	}, [token])
	return ref
}
