// import type { Filter, LuumSpec } from "~"

// import { unfiltered } from "~/constants/filters"
// import { defaultSpec } from "~/constants/spec"
// import { specToHex } from "~/export"
// import type { Mix, Mixer } from "~/mixers"
// import mixers from "~/mixers"
// import mapObject from "~/utils/mapObject"

// import type {
//   Swatch,
//   InteractivePalette,
//   InteractiveScheme,
//   InteractiveSwatch,
//   InteractiveMix,
//   Scheme,
//   NonInteractiveScheme,
//   NonInteractivePalette,
// } from "."

// export const isInteractiveSwatch = (
//   swatch: InteractiveSwatch | Swatch | undefined
// ): swatch is InteractiveSwatch => {
//   if (swatch === undefined) return false
//   return Boolean((swatch as InteractiveSwatch).base)
// }

// type MixNewSpec = (spec: LuumSpec, mix: Mix) => LuumSpec

// export const mixNewSpec: MixNewSpec = (spec, mix) =>
//   mix.reduce<LuumSpec>((currentColor, [name, value]) => {
//     const mixer = mixers[name] as Mixer<typeof value>
//     return mixer(currentColor, value)
//   }, spec)

// type MixNewSwatch = (spec: LuumSpec, mix: Mix, filter?: Filter) => Swatch

// export const mixNewSwatch: MixNewSwatch = (spec, mix, filter) => {
//   const wet = mixNewSpec(spec, mix)
//   const dry = specToHex(wet, filter)
//   return { wet, dry }
// }

// type MixPaletteStatic = <S extends NonInteractiveScheme>(
//   scheme: S,
//   parent?: {
//     filter: Filter
//     attributes: Record<string, InteractiveSwatch> | Record<string, Swatch>
//   }
// ) => NonInteractivePalette<S>

// // export const mixPaletteStatic: MixPaletteStatic = (scheme, parent) => {
// //   const filter = scheme.filter || parent?.filter || unfiltered
// //   const rootSpec = mixNewSpec(defaultSpec, scheme.root || [])

// //   const paletteAttributes =
// //   mapObject(scheme.attributes, (mix: Mix, key) => {
// //     const parentAttribute = parent?.attributes[key]
// //     const startingPoint = isInteractiveSwatch(parentAttribute)
// //       ? parentAttribute.base.wet
// //       : parentAttribute?.wet || rootSpec

// //     console.log(parentAttribute)
// //     console.log(startingPoint)
// //     return mixNewSwatch(startingPoint, mix, filter)
// //   }) as Record<keyof typeof scheme.attributes, Swatch>

// //   const palette: NonInteractivePalette<typeof scheme> = {
// //     attributes: paletteAttributes as NonInteractivePalette<
// //       typeof scheme
// //     >[`attributes`],
// //   }

// //   if (scheme.children) {
// //     palette.children = mapObject(scheme.children, (child: Scheme) =>
// //       mixPalette(child, { filter, attributes: paletteAttributes })
// //     ) as NonInteractivePalette<typeof scheme>[`children`]
// //   }

// //   return palette
// // }

// // type MixPaletteInteractive = <S extends InteractiveScheme>(
// //   scheme: S,
// //   parent?: {
// //     filter: Filter
// //     attributes: Record<string, InteractiveSwatch> | Record<string, Swatch>
// //   }
// // ) => InteractivePalette<S>

// // export const mixPaletteInteractive: MixPaletteInteractive
// // = (scheme, parent) => {
// //   const filter = scheme.filter || parent?.filter || unfiltered
// //   const rootSpec = mixNewSpec(defaultSpec, scheme.root || [])

// //   const baseSwatches = mapObject(
// //     scheme.attributes,
// //     (attribute: InteractiveMix, key) => {
// //       const parentAttribute = parent?.attributes[key]
// //       const startingPoint = isInteractiveSwatch(parentAttribute)
// //         ? parentAttribute.base.wet
// //         : parentAttribute?.wet || rootSpec
// //       return mixNewSwatch(startingPoint, attribute.base, filter)
// //     }
// //   ) as Record<keyof typeof scheme.attributes, Swatch>

// //   const paletteAttributes = mapObject(
// //     scheme.attributes,
// //     (attribute: InteractiveMix, attributeKey) =>
// //       mapObject(attribute, (state: Mix, stateKey) => {
// //         if (stateKey === `base`) {
// //           return baseSwatches[attributeKey]
// //         }
// //         return mixNewSwatch(baseSwatches[attributeKey].wet, state, filter)
// //       })
// //   ) as InteractivePalette<typeof scheme>[`attributes`]

// //   const palette: InteractivePalette<typeof scheme> = {
// //     attributes: paletteAttributes,
// //   }

// //   if (scheme.children) {
// //     palette.children = mapObject(scheme.children, (child: Scheme) =>
// //       mixPalette(child, { filter, attributes: paletteAttributes })
// //     ) as InteractivePalette<typeof scheme>[`children`]
// //   }

// //   return palette
// // }

// // export const isInteractiveScheme =
// // (scheme: Scheme): scheme is InteractiveScheme =>
// //   !Array.isArray(Object.values(scheme.attributes)[0])

// // type MixPalette = <S extends Scheme>(
// //   scheme: S,
// //   parent?: {
// //     filter: Filter
// //     attributes: Record<string, InteractiveSwatch> | Record<string, Swatch>
// //   }
// //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// // ) => InteractivePalette<any> | NonInteractivePalette<any>

// // export const mixPalette: MixPalette = (scheme, parent) =>
// //   isInteractiveScheme(scheme)
// //     ? mixPaletteInteractive(scheme, parent)
// //     : mixPaletteStatic(scheme, parent)
