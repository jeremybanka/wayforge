import normalizeHex from "./normalizeHex"
import type { ChannelObject } from ".."

export default (maybeHex: string): ChannelObject => {
	const hex = normalizeHex(maybeHex)

	return {
		R: parseInt(hex.slice(0, 2), 16),
		G: parseInt(hex.slice(2, 4), 16),
		B: parseInt(hex.slice(4, 6), 16),
	}
}
