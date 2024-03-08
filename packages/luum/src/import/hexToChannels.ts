import type { ChannelObject } from ".."
import normalizeHex from "./normalizeHex"

export default (maybeHex: string): ChannelObject => {
	const hex = normalizeHex(maybeHex)

	return {
		R: Number.parseInt(hex.slice(0, 2), 16),
		G: Number.parseInt(hex.slice(2, 4), 16),
		B: Number.parseInt(hex.slice(4, 6), 16),
	}
}
