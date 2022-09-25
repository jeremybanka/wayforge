// import type {
//   CssSelector,
//   InteractivePalette,
//   NonInteractivePalette,
//   Palette,
//   Scheme,
// } from "."
// import { mixPalette } from "."

// /* eslint-disable @typescript-eslint/no-explicit-any */
// export const isInteractivePalette = (
//   palette: Palette<any>
// ): palette is InteractivePalette<any> =>
//   !Object.values(palette.attributes)[0].dry
// /* eslint-enable @typescript-eslint/no-explicit-any */

// const indent = (indent = 1, text: string) => ` `.repeat(indent * 2) + text

// const openCssRule = (gen = 0, ...selectors: CssSelector[]): string =>
//   selectors.length > 1
//     ? selectors.reduce<string>((acc, selector, idx) => {
//         const maybeComma = idx === 0 ? `` : `,`
//         return `\n` + indent(gen, selector) + maybeComma + acc
//       }, ``) + ` {\n`
//     : `${indent(gen, `${selectors[0]} {\n`)}`

// const closeCssRule = (gen = 0) => `${indent(gen, `}\n`)}`

// const createCssProperty = (key: string, value: string, gen = 0) =>
//   indent(1 + gen, `${key}: ${value};\n`)

// export const paletteToScssDeclarationStatic = (
//   palette: NonInteractivePalette<any>,
//   generation: number
// ): string => {
//   let scssDeclaration = ``
//   for (const [attribute, { dry: hex }]
//   of Object.entries(palette.attributes)) {
//     scssDeclaration += createCssProperty(attribute, hex, generation)
//   }
//   return scssDeclaration
// }

// export const paletteToScssDeclarationInteractive = (
//   palette: InteractivePalette<any>,
//   gen: number
// ): string => {
//   let declaration = ``
//   const stateDeclarations = {
//     hover: openCssRule(gen + 1, `&:hover`, `&:focus`, `&:focus-within`),
//     active: openCssRule(gen + 1, `&:active`, `&.active`),
//     disabled: openCssRule(gen + 1, `&:disabled`, `&.disabled`),
//   }
//   for (const [key, { base, hover, active, disabled }] of Object.entries(
//     palette.attributes
//   )) {
//     declaration += createCssProperty(key, base.dry, gen)
//     stateDeclarations.hover += createCssProperty(key, hover.dry, gen + 1)
//     stateDeclarations.active += createCssProperty(key, active.dry, gen + 1)
//     stateDeclarations.disabled
//     += createCssProperty(key, disabled.dry, gen + 1)
//   }
//   stateDeclarations.hover += closeCssRule(gen + 1)
//   stateDeclarations.active += closeCssRule(gen + 1)
//   stateDeclarations.disabled += closeCssRule(gen + 1)
//   declaration += stateDeclarations.hover
//   declaration += stateDeclarations.active
//   declaration += stateDeclarations.disabled
//   return declaration
// }

// export const paletteToScssDeclaration = <T extends Scheme>(
//   palette: Palette<T>,
//   generation: number
// ): string =>
//   isInteractivePalette(palette)
//     ? paletteToScssDeclarationInteractive(palette, generation)
//     : paletteToScssDeclarationStatic(palette, generation)

// export const nestChildRules = (
//   palette: Palette<any>,
//   generation: number
// ): string => {
//   let nestedRules = ``
//   if (palette.children) {
//     for (const child of Object.entries(palette.children)) {
//       const [selector, childPalette] = child as [CssSelector, Palette<any>]
//       nestedRules += paletteToScssRule(selector, childPalette, generation + 1)
//     }
//   }
//   return nestedRules
// }

// export const paletteToScssRule = (
//   selector: CssSelector,
//   palette: Palette<any>,
//   generation = 0
// ): string => {
//   let scssBlock = openCssRule(generation, selector)
//   scssBlock += paletteToScssDeclaration(palette, generation)
//   scssBlock += nestChildRules(palette, generation)
//   scssBlock += closeCssRule(generation)
//   return scssBlock
// }

// export type SchemeToScssRule =
// (selector: CssSelector, scheme: Scheme) => string

// export const schemeToScssRule: SchemeToScssRule = (selector, scheme) => {
//   const palette = mixPalette(scheme)
//   const scss = paletteToScssRule(selector, palette)
//   return scss
// }
