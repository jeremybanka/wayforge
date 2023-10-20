import { content, each, isArray, join, map } from "~/packages/anvl/src/array"
import { isModifier, pipe } from "~/packages/anvl/src/function"
import type { Modifier, OneOrMany } from "~/packages/anvl/src/function"
import { isUndefined } from "~/packages/anvl/src/nullish"
import { key } from "~/packages/anvl/src/object/access"
import { isString } from "~/packages/anvl/src/primitive"
import type { Refinement } from "~/packages/anvl/src/refinement"
import { specToHex } from "~/packages/luum/src"
import type { Filter, FilterPoint, LuumSpec } from "~/packages/luum/src"
import { defaultSpec } from "~/packages/luum/src/constants/luum-spec"
import { shadeBy } from "~/packages/luum/src/mixers/lum"

/* eslint-disable max-lines */

// export type InteractiveStates = `active` | `base` | `disabled` | `hover`

// export const HTML_ELEMENT_NAMES = [
//   `a`,
//   `abbr`,
//   `address`,
//   `area`,
//   `article`,
//   `aside`,
//   `audio`,
//   `b`,
//   `base`,
//   `bdi`,
//   `bdo`,
//   `big`,
//   `blockquote`,
//   `body`,
//   `br`,
//   `button`,
//   `canvas`,
//   `caption`,
//   `cite`,
//   `code`,
//   `col`,
//   `colgroup`,
//   `data`,
//   `datalist`,
//   `dd`,
//   `del`,
//   `details`,
//   `dfn`,
//   `dialog`,
//   `div`,
//   `dl`,
//   `dt`,
//   `em`,
//   `embed`,
//   `fieldset`,
//   `figcaption`,
//   `figure`,
//   `footer`,
//   `form`,
//   `h1`,
//   `h2`,
//   `h3`,
//   `h4`,
//   `h5`,
//   `h6`,
//   `head`,
//   `header`,
//   `hgroup`,
//   `hr`,
//   `html`,
//   `i`,
//   `iframe`,
//   `img`,
//   `input`,
//   `ins`,
//   `kbd`,
//   `keygen`,
//   `label`,
//   `legend`,
//   `li`,
//   `link`,
//   `main`,
//   `map`,
//   `mark`,
//   `menu`,
//   `menuitem`,
//   `meta`,
//   `meter`,
//   `nav`,
//   `noscript`,
//   `object`,
//   `ol`,
//   `optgroup`,
//   `option`,
//   `output`,
//   `p`,
//   `param`,
//   `picture`,
//   `pre`,
//   `progress`,
//   `q`,
//   `rp`,
//   `rt`,
//   `ruby`,
//   `s`,
//   `samp`,
//   `script`,
//   `section`,
//   `select`,
//   `small`,
//   `source`,
//   `span`,
//   `strong`,
//   `style`,
//   `sub`,
//   `summary`,
//   `sup`,
//   `table`,
//   `tbody`,
//   `td`,
//   `textarea`,
//   `tfoot`,
//   `th`,
//   `thead`,
//   `time`,
//   `title`,
//   `tr`,
//   `track`,
//   `u`,
//   `ul`,
//   `var`,
//   `video`,
//   `wbr`,
// ] as const

// export type HTMLElementName = typeof HTML_ELEMENT_NAMES[number]

// export type UniversalSelector = `*`

// export type TypeSelector = HTMLElementName | `body` | `html`

// export type ClassSelector = `.${string}`

// export type IdSelector = `#${string}`

// export type ParentSelector = `&`

// export type AttributeSelector = `["${string}"="${string}"]`

// export type CssSelectorCore =
//   | AttributeSelector
//   | ClassSelector
//   | IdSelector
//   | ParentSelector
//   | TypeSelector
//   | UniversalSelector

// export type CssCombinator = ` ` | ` + ` | ` > ` | ` ~ `

export const CSS_PSEUDO_CLASSES = [
	`:active`,
	`:checked`,
	`:disabled`,
	`:enabled`,
	`:focus`,
	`:hover`,
	`:indeterminate`,
	`:visited`,
] as const

export type CssPseudoClass = typeof CSS_PSEUDO_CLASSES[number]

export const isCssPseudoClass = (s: unknown): s is CssPseudoClass =>
	CSS_PSEUDO_CLASSES.includes(s as CssPseudoClass)

// export type CssPseudoElement =
//   | `::after`
//   | `::backdrop`
//   | `::before`
//   | `::first-letter`
//   | `::first-line`
//   | `::placeholder`
//   | `::selection`

// export type CssSelectorExtension =
//   | AttributeSelector
//   | ClassSelector
//   | CssPseudoClass
//   | CssPseudoElement
//   | `${CssCombinator}${CssSelectorCore}`

// export type CssSelector =
//   | CssSelectorCore
//   | `${CssSelectorCore}${CssSelectorExtension}`

export const CSS_COLOR_PROPERTY_KEYS = [
	`background-color`,
	`background`,
	`border-bottom-color`,
	`border-color`,
	`border-left-color`,
	`border-right-color`,
	`border-top-color`,
	`border`,
	`box-shadow`,
	`caret-color`,
	`color`,
	`column-rule-color`,
	`column-rule`,
	`filter`,
	`opacity`,
	`outline-color`,
	`outline`,
	`text-decoration-color`,
	`text-decoration`,
	`text-shadow`,

	`fill`,
	`stroke`,
] as const

export type CssVariable = `--${string}`

export type CssColorPropertyKey =
	| CssVariable
	| typeof CSS_COLOR_PROPERTY_KEYS[number]

export const isCssColorPropertyKey = (
	input: unknown,
): input is CssColorPropertyKey =>
	typeof input === `string` &&
	(CSS_COLOR_PROPERTY_KEYS.includes(
		input as typeof CSS_COLOR_PROPERTY_KEYS[number],
	) ||
		input.startsWith(`--`))

export const isFilterPoint = (input: unknown): input is FilterPoint =>
	typeof input === `object` &&
	typeof (input as FilterPoint).hue === `number` &&
	typeof (input as FilterPoint).sat === `number`

export const isFilter = (input: unknown): input is Filter =>
	isArray(isFilterPoint)(input)

export const maybe =
	<T>(validate: Refinement<unknown, T>) =>
	(input: unknown): input is T | undefined =>
		isUndefined(input) || validate(input)

export const isLuumSpec = (input: unknown): input is LuumSpec =>
	typeof input === `object` &&
	input !== null &&
	typeof (input as LuumSpec).hue === `number` &&
	typeof (input as LuumSpec).sat === `number` &&
	typeof (input as LuumSpec).lum === `number` &&
	[`sat`, `lum`].includes((input as LuumSpec).prefer)

export const isLuumSpecModifier: Refinement<
	unknown,
	Modifier<LuumSpec>
> = isModifier(isLuumSpec)(defaultSpec)

export type LuumCssAttribute = [
	keys: OneOrMany<CssColorPropertyKey>,
	transformers: OneOrMany<Modifier<LuumSpec>>,
]
export const isLuumCssAttribute = (input: unknown): input is LuumCssAttribute =>
	Array.isArray(input) &&
	input.length === 2 &&
	content(isCssColorPropertyKey)(input[0]) &&
	content(isLuumSpecModifier)(input[1])

export type LuumScssPseudoClassRule = [
	selectors: OneOrMany<CssPseudoClass>,
	attributes: OneOrMany<LuumCssAttribute>,
]

export const isLuumScssPseudoClassRule = (
	input: unknown,
): input is LuumScssPseudoClassRule =>
	Array.isArray(input) &&
	input.length === 2 &&
	content(isCssPseudoClass)(input[0]) &&
	content(isLuumCssAttribute)(input[1])

export type LuumScssNestedRule = [
	selectors: OneOrMany<string>,
	attributes: OneOrMany<LuumCssAttribute>,
]

export const isLuumScssNestedRule = (
	input: unknown,
): input is LuumScssNestedRule =>
	Array.isArray(input) &&
	input.length === 2 &&
	content(isString)(input[0]) &&
	content(isLuumCssAttribute)(input[1])

export type LuumCssRule = {
	rootSelectors?: OneOrMany<string>
	root: LuumSpec
	attributes: OneOrMany<LuumCssAttribute>
	filter?: Filter
}

export const isLuumCssRule = (input: unknown): input is LuumCssRule =>
	typeof input === `object` &&
	input !== null &&
	isLuumSpec((input as LuumCssRule).root) &&
	content(isLuumCssAttribute)(key<LuumCssRule>(`attributes`)(input)) &&
	maybe(content(isString))(key<LuumCssRule>(`rootSelectors`)(input)) &&
	maybe(isFilter)(key<LuumCssRule>(`filter`)(input))

export type LuumScssRule = LuumCssRule & {
	states?: OneOrMany<LuumScssPseudoClassRule>
	children?: OneOrMany<LuumScssNestedRule>
}

export const isLuumScssRule = (input: unknown): input is LuumScssRule =>
	isLuumCssRule(input) &&
	maybe(content(isLuumScssPseudoClassRule))(
		key<LuumScssRule>(`states`)(input),
	) &&
	maybe(content(isLuumScssNestedRule))(key<LuumScssRule>(`children`)(input))

export const RED: LuumSpec = {
	hue: 0,
	sat: 255,
	lum: 0.5,
	prefer: `sat`,
}

export const WAYFORGE_CORE_COLOR_NAMES = [
	`Red`,
	`Orange`,
	`Yellow`,
	`Lime`,
	`Green`,
	`Teal`,
	`Cyan`,
	`Blue`,
	`Indigo`,
	`Violet`,
	`Magenta`,
	`Pink`,
] as const

export type WayforgeCoreColorName = typeof WAYFORGE_CORE_COLOR_NAMES[number]

export const WAYFORGE_CORE_COLORS: Readonly<
	Record<WayforgeCoreColorName, LuumSpec>
> = WAYFORGE_CORE_COLOR_NAMES.reduce((acc, name, idx) => {
	acc[name] = {
		hue: idx * 30,
		sat: 255,
		lum: 0.5,
		prefer: `sat`,
	}
	return acc
}, {} as Record<WayforgeCoreColorName, LuumSpec>)

export const PAINT_MY_WAGON_RED: LuumScssRule = {
	rootSelectors: [`.wagon`],
	root: RED,
	attributes: [`background-color`, shadeBy(5)],
	states: [
		[
			[`:hover`, `:focus`],
			[`background-color`, shadeBy(10)],
		],
		[`:active`, [`background-color`, shadeBy(15)]],
	],
}

const LF = `\n`

export const luumToCss = (rule: LuumCssRule): string => {
	const {
		attributes: oneOrManyAttributes,
		root,
		rootSelectors: maybeOneOrManyRootSelectors,
		filter: maybeFilter,
	} = rule
	const rootSelectors = pipe(
		maybeOneOrManyRootSelectors,
		each(isString),
		join(`, ` + LF),
		(s) => (s ? s + ` {` + LF : ``),
	)
	const attributes = pipe(
		oneOrManyAttributes,
		each(isLuumCssAttribute),
		map(([oneOrManyKeys, oneOrManyModifiers]) => {
			const modifiers = each(isLuumSpecModifier)(oneOrManyModifiers)
			const modifiedSpec = modifiers.reduce((last, modify) => modify(last), root)
			const hex = specToHex(modifiedSpec, maybeFilter)
			return pipe(
				oneOrManyKeys,
				each(isCssColorPropertyKey),
				map((key) => `${key}: ${hex}`),
				join(`; ` + LF),
			)
		}),
		join(`; ` + LF),
	)
	return rootSelectors ? join(LF)([rootSelectors, attributes, `}`]) : attributes
}

// export const luumToScss = (rule: LuumScssRule): string => {
//   const {
//     rootSelectors: maybeOneOrManyRootSelectors,
//     root,
//     attributes: oneOrManyAttributes,
//     filter,
//     states: maybeOneOrManyStates,
//     children: maybeOneOrManyChildren,
//   } = rule
//   const rootSelectors = pipe(
//     maybeOneOrManyRootSelectors,
//     each(isString),
//     join(`, ` + LF)
//   )
//   return ``
// }

// export const luumToScss = (rule: LuumScssRule): string => {
//   const { rootSelector, root, filter, attributes, states, children } = rule
//   let scss = ``
//   const depth = 0
//   if (rootSelector) scss += `${rootSelector} {`
//   return ``
// }
