import type { Applicator } from "~/lib/Anvil/function"

import type { LuumSpec } from ".."

export type LuumApplicator<X> = Applicator<X, LuumSpec>

export * from "./hue"
export * from "./sat"
export * from "./lum"
export * from "./contrast"

// import type { LuumSpec } from "~"

// import { specToHexFixLimit } from "~/export"
// import { hexToSpec } from "~/import"

// import contrast from "./contrast"
// import { setHue, split, tetra, trine } from "./hue"
// import { setLum, shade, tint } from "./lum"
// import { setSat, amp, mute } from "./sat"

// export type MixerArgs = {
//   hex: string
//   spec: LuumSpec
//   hue: number
//   sat: number
//   lum: number
//   prefer: `lum` | `sat`
//   fix: `lum` | `sat`
//   contrast: 0 | 1 | 2
//   amp: number
//   mute: number
//   tint: number
//   shade: number
//   split: number
//   tetra: number
//   trine: number
//   //cool: number
//   //warm: number
// }

// export type MixerName = keyof MixerArgs

// export type MixTuple<N extends MixerName> = [N, MixerArgs[N]]

// export type Mix = MixTuple<keyof MixerArgs>[]

// export type SwatchRemixer = (swatch: Swatch) => Swatch

// export type Mixer<V = never> = (color: LuumSpec, value: V) => LuumSpec

// const mixers: {
//   [Name in MixerName]: Mixer<MixerArgs[Name]>
// } = {
//   hex: (color, value) => ({ ...color, ...hexToSpec(value) }),
//   spec: (_, value) => ({ ...value }),
//   hue: setHue,
//   sat: setSat,
//   lum: setLum,
//   fix: (color, prefer) => ({
//     ...color,
//     prefer,
//     ...specToHexFixLimit({ ...color, prefer }).fix,
//   }),
//   prefer: (color, prefer) => ({ ...color, prefer }),
//   amp,
//   contrast,
//   mute,
//   tint,
//   shade,
//   split,
//   tetra,
//   trine,
// }

// export default mixers
