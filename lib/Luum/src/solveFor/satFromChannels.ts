import type { ChannelObject } from "^"

const satFromChannels = ({ R, G, B }: ChannelObject): number => {
  const sat = Math.max(R, G, B) - Math.min(R, G, B)
  // console.log('||| found sat', sat)
  return sat
}

export default satFromChannels
