export namespace TSD {
	type Flat<
		T extends
			| T[]
			| {
					[K in keyof T]: T[K]
			  },
	> = T extends T[]
		? Flat<T[number]>
		: T extends object
			? {
					[K in keyof T]: Flat<T[K]>
				}
			: T

	export type PlainText = {
		type: `plainText`
		text: string
	}
	export type LinkTag = {
		type: `link`
		linkType: `MemberIdentifier`
		text: string
	}
	export type Break = {
		type: `softBreak`
	}
	export type ParagraphContent = Break | LinkTag | PlainText
	export type Paragraph = {
		type: `paragraph`
		content: ParagraphContent[]
	}
	export type FencedCode = {
		type: `fencedCode`
		content: string
	}
	export type SectionContent = FencedCode | Paragraph
	export type DocSection = {
		type: `section`
		content: SectionContent[]
	}
	export type DocBlock = {
		type: `block`
		name: string
		desc?: Paragraph
	}

	export type ParamBlock = {
		type: `paramBlock`
		name: string
		desc?: Paragraph
	}

	export type DocContent = {
		name: string
		sections: DocSection[]
		modifierTags: string[]
		blocks: DocBlock[]
	}

	export type RegularFunctionDoc = Flat<
		DocContent & {
			type: `function`
			kind: `regular`
			params: ParamBlock[]
		}
	>

	export type OverloadedFunctionDoc = Flat<{
		name: string
		type: `function`
		kind: `overloaded`
		overloads: RegularFunctionDoc[]
	}>

	export type FunctionDoc = OverloadedFunctionDoc | RegularFunctionDoc

	export type AtomicEntity = `constant` | `type` | `variable`
	export type AtomicDoc = Flat<
		DocContent & {
			type: `atomic`
			kind: AtomicEntity
		}
	>

	export type CompositeEntity = `class` | `interface` | `object` | `type`
	export type CompositeDoc = Flat<
		DocContent & {
			type: `composite`
			kind: CompositeEntity
			properties: Doc[]
		}
	>

	export type Doc = AtomicDoc | CompositeDoc | FunctionDoc
}
