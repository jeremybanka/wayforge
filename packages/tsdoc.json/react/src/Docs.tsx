import type { TSD } from "tsdoc.json"

export type ModProps = {
	docs: TSD.Doc[]
	className?: string
}
export function Mod({ docs, className = `` }: ModProps): JSX.Element {
	return (
		<div className={`tsdoc-module ${className}`}>
			{docs.map((doc) => (
				<Doc key={doc.name} doc={doc} />
			))}
		</div>
	)
}

export type DocProps = {
	doc: TSD.Doc
}
export function Doc({ doc }: DocProps): JSX.Element {
	const offset0 = stringToNumber(doc.name)
	const offset1 = offset0 << 1
	return (
		<article
			className={`tsdoc-resource ${doc.type} ${doc.kind}`}
			style={{
				backgroundPosition: offset0 / 100000 + `% ` + offset1 / 100000 + `%`,
			}}
		>
			<header>
				<main>
					<code>{doc.name}</code>
				</main>
				<footer>
					<span>{doc.type === `function` ? `function` : doc.kind}</span>
				</footer>
			</header>
			<main>
				{(() => {
					switch (doc.type) {
						case `function`:
							return <FunctionMainContent doc={doc} />
					}
				})()}
			</main>
		</article>
	)
}

type FunctionMainContentProps = {
	doc: TSD.FunctionDoc
}
function FunctionMainContent({ doc }: FunctionMainContentProps): JSX.Element {
	switch (doc.kind) {
		case `regular`:
			return <RegularFunctionMainContent doc={doc} />
		case `overloaded`:
			return <OverloadedFunctionMainContent doc={doc} />
	}
}

type OverloadedFunctionMainContentProps = {
	doc: TSD.OverloadedFunctionDoc
}
function OverloadedFunctionMainContent({
	doc,
}: OverloadedFunctionMainContentProps): JSX.Element {
	const withoutImplementation = doc.overloads.slice(0, -1)
	return (
		<>
			{withoutImplementation.map((overload, idx) => {
				const overloadBlock = overload.blocks.find(
					(block) => block.name === `@overload`,
				)
				const overloadName =
					overloadBlock?.desc?.content[0].type === `plainText`
						? overloadBlock.desc.content[0].text
						: idx.toString()
				if (doc.name === `atom`) console.log(overloadName)
				return (
					<article
						className={`tsdoc-resource ${overload.type} ${overload.kind}`}
						key={overload.name}
					>
						<header>
							<main>
								<span>{overloadName}</span>
							</main>
							<footer>
								<span>overload</span>
							</footer>
						</header>
						<main>
							<RegularFunctionMainContent
								doc={{ ...overload, name: overloadName }}
							/>
						</main>
					</article>
				)
			})}
		</>
	)
}

type RegularFunctionMainContentProps = {
	doc: TSD.RegularFunctionDoc
}
function RegularFunctionMainContent({
	doc,
}: RegularFunctionMainContentProps): JSX.Element {
	const returnValue = doc.blocks.find((block) => block.name === `@returns`)
	return (
		<>
			<div className="tsdoc-summary">
				{doc.sections.map((section) => (
					<DocSection key={JSON.stringify(section)} section={section} />
				))}
			</div>
			<div className="tsdoc-params">
				{doc.params.length ? (
					<header>
						<span>Parameters</span>
					</header>
				) : null}
				<ol className="tsdoc-param-list" start={0}>
					{doc.params.map((param, index) => (
						<ParamBlock key={param.name} param={param} index={index} />
					))}
				</ol>
			</div>
			{returnValue ? <Block block={returnValue} /> : null}
		</>
	)
}

type ParamBlockProps = {
	param: TSD.ParamBlock
	index: number
}
function ParamBlock({ param, index }: ParamBlockProps): JSX.Element {
	return (
		<li className="tsdoc-param-block">
			<header>
				<main>
					<code>{param.name}</code>
				</main>
				<footer>
					<span>{index}</span>
				</footer>
			</header>
			<main>{param.desc ? <Paragraph paragraph={param.desc} /> : null}</main>
		</li>
	)
}

type BlockProps = {
	block: TSD.DocBlock
}
function Block({ block }: BlockProps): JSX.Element {
	const blockName = block.name.split(`@`)[1]
	return (
		<div className={`tsdoc-block ${block.name}`}>
			<header>
				<span>{blockName}</span>
			</header>
			<main>{block.desc ? <Paragraph paragraph={block.desc} /> : null}</main>
		</div>
	)
}

type SectionProps = {
	section: TSD.DocSection
}
function DocSection({ section }: SectionProps): JSX.Element {
	return (
		<div className="tsdoc-section" key={JSON.stringify(section)}>
			{section.content.map((content) => (
				<SectionContent key={JSON.stringify(content)} content={content} />
			))}
		</div>
	)
}

type SectionContentProps = {
	content: TSD.SectionContent
}
function SectionContent({ content }: SectionContentProps): JSX.Element {
	switch (content.type) {
		case `paragraph`:
			return <Paragraph paragraph={content} />
		case `fencedCode`:
			return <FencedCode fencedCode={content} />
	}
}

type FencedCodeProps = {
	fencedCode: TSD.FencedCode
}
function FencedCode({ fencedCode }: FencedCodeProps): JSX.Element {
	return (
		<pre className="tsdoc-fenced-code">
			<code>{fencedCode.content}</code>
		</pre>
	)
}

type ParagraphProps = {
	paragraph: TSD.Paragraph
}
function Paragraph({ paragraph }: ParagraphProps): JSX.Element {
	return (
		<p className="tsdoc-paragraph" key={JSON.stringify(paragraph)}>
			{paragraph.content.map((content) => (
				<ParagraphContent key={JSON.stringify(content)} content={content} />
			))}
		</p>
	)
}

type ParagraphContentProps = {
	content: TSD.ParagraphContent
}
function ParagraphContent({
	content,
}: ParagraphContentProps): JSX.Element | null {
	switch (content.type) {
		case `link`:
			return <code className="tsdoc-link">{content.text}</code>
		case `plainText`:
			return <span className="tsdoc-plain-text">{content.text}</span>
		case `softBreak`:
			return null
	}
}

function stringToNumber(str: string): number {
	let hash = 0
	if (str.length === 0) return hash
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash |= 0 // Convert to 32bit integer
	}
	return hash
}
