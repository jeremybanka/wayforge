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
	return (
		<article className={`tsdoc-resource ${doc.type} ${doc.kind}`}>
			<header>
				<main>
					<code>{doc.name}</code>
				</main>
				<footer>{doc.type === `function` ? `function` : doc.kind}</footer>
			</header>
			<main>
				{(() => {
					switch (doc.type) {
						case `function`:
							return <FunctionDoc doc={doc} />
					}
				})()}
			</main>
		</article>
	)
}

type FunctionDocProps = {
	doc: TSD.FunctionDoc
}
function FunctionDoc({ doc }: FunctionDocProps): JSX.Element {
	switch (doc.kind) {
		case `regular`:
			return <RegularFunctionDoc doc={doc} />
		case `overloaded`:
			return <OverloadedFunctionDoc doc={doc} />
	}
}

type OverloadedFunctionDocProps = {
	doc: TSD.OverloadedFunctionDoc
}
function OverloadedFunctionDoc({
	doc,
}: OverloadedFunctionDocProps): JSX.Element {
	return (
		<>
			{doc.overloads.map((overload) => (
				<RegularFunctionDoc key={overload.name} doc={overload} />
			))}
		</>
	)
}

type RegularFunctionDocProps = {
	doc: TSD.RegularFunctionDoc
}
function RegularFunctionDoc({ doc }: RegularFunctionDocProps): JSX.Element {
	const returnValue = doc.blocks.find((block) => block.name === `@returns`)
	return (
		<>
			<div className="tsdoc-summary">
				{doc.sections.map((section) => (
					<DocSection key={JSON.stringify(section)} section={section} />
				))}
			</div>
			<div className="tsdoc-params">
				<header>Parameters</header>
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
				<footer>{index}</footer>
			</header>
			<main>{param.desc ? <Paragraph paragraph={param.desc} /> : null}</main>
		</li>
	)
}

type BlockProps = {
	block: TSD.DocBlock
}
function Block({ block }: BlockProps): JSX.Element {
	return (
		<div className={`tsdoc-block ${block.name}`}>
			<header>{block.name}</header>
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
