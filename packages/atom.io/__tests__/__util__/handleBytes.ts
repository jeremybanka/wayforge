import type { Fn, Subject } from "atom.io/internal"

export function handleBytes(subject: Subject<string>, handler: Fn): void {
	subject.subscribe(`TEST`, (update) => {
		const encoder = new TextEncoder()
		const uint8 = encoder.encode(update)
		handler(...uint8)
	})
}
