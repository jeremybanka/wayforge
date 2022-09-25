import { hueFromChannels, satFromChannels, lumFromChannels } from "../solveFor"
import type { ChannelObject, HSL } from "^"

const channelsToSpec = ({ R, G, B }: ChannelObject): HSL => {
  const hue = hueFromChannels({ R, G, B })
  const sat = satFromChannels({ R, G, B })
  const lum = lumFromChannels({ R, G, B })
  return { hue, sat, lum }
}

export default channelsToSpec
