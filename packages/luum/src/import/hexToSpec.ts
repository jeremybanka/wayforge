import type { HSL } from ".."
import channelsToSpec from "./channelsToSpec"
import hexToChannels from "./hexToChannels"

const hexToSpec = (hex: string): HSL => {
	const { R, G, B } = hexToChannels(hex)
	const { hue, sat, lum } = channelsToSpec({ R, G, B })
	return { hue, sat, lum }
}

export default hexToSpec
