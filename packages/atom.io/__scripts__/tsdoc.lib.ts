import * as os from "node:os"
import * as path from "node:path"

import * as tsdoc from "@microsoft/tsdoc"
import colors from "colors"
import TS from "typescript"

/**
 * Returns true if the specified SyntaxKind is part of a declaration form.
 *
 * Based on ts.isDeclarationKind() from the compiler.
 * https://github.com/microsoft/TypeScript/blob/v3.0.3/src/compiler/utilities.ts#L6382
 */
function isDeclarationKind(kind: TS.SyntaxKind): boolean {
	return (
		kind === TS.SyntaxKind.ArrowFunction ||
		kind === TS.SyntaxKind.BindingElement ||
		kind === TS.SyntaxKind.ClassDeclaration ||
		kind === TS.SyntaxKind.ClassExpression ||
		kind === TS.SyntaxKind.Constructor ||
		kind === TS.SyntaxKind.EnumDeclaration ||
		kind === TS.SyntaxKind.EnumMember ||
		kind === TS.SyntaxKind.ExportSpecifier ||
		kind === TS.SyntaxKind.FunctionDeclaration ||
		kind === TS.SyntaxKind.FunctionExpression ||
		kind === TS.SyntaxKind.GetAccessor ||
		kind === TS.SyntaxKind.ImportClause ||
		kind === TS.SyntaxKind.ImportEqualsDeclaration ||
		kind === TS.SyntaxKind.ImportSpecifier ||
		kind === TS.SyntaxKind.InterfaceDeclaration ||
		kind === TS.SyntaxKind.JsxAttribute ||
		kind === TS.SyntaxKind.MethodDeclaration ||
		kind === TS.SyntaxKind.MethodSignature ||
		kind === TS.SyntaxKind.ModuleDeclaration ||
		kind === TS.SyntaxKind.NamespaceExportDeclaration ||
		kind === TS.SyntaxKind.NamespaceImport ||
		kind === TS.SyntaxKind.Parameter ||
		kind === TS.SyntaxKind.PropertyAssignment ||
		kind === TS.SyntaxKind.PropertyDeclaration ||
		kind === TS.SyntaxKind.PropertySignature ||
		kind === TS.SyntaxKind.SetAccessor ||
		kind === TS.SyntaxKind.ShorthandPropertyAssignment ||
		kind === TS.SyntaxKind.TypeAliasDeclaration ||
		kind === TS.SyntaxKind.TypeParameter ||
		kind === TS.SyntaxKind.VariableDeclaration ||
		kind === TS.SyntaxKind.JSDocTypedefTag ||
		kind === TS.SyntaxKind.JSDocCallbackTag ||
		kind === TS.SyntaxKind.JSDocPropertyTag
	)
}

/**
 * Retrieves the JSDoc-style comments associated with a specific AST node.
 *
 * Based on ts.getJSDocCommentRanges() from the compiler.
 * https://github.com/microsoft/TypeScript/blob/v3.0.3/src/compiler/utilities.ts#L924
 */
function getJSDocCommentRanges(node: TS.Node, text: string): TS.CommentRange[] {
	const commentRanges: TS.CommentRange[] = []

	switch (node.kind) {
		case TS.SyntaxKind.Parameter:
		case TS.SyntaxKind.TypeParameter:
		case TS.SyntaxKind.FunctionExpression:
		case TS.SyntaxKind.ArrowFunction:
		case TS.SyntaxKind.ParenthesizedExpression:
			commentRanges.push(...(TS.getTrailingCommentRanges(text, node.pos) ?? []))
			break
	}
	commentRanges.push(...(TS.getLeadingCommentRanges(text, node.pos) ?? []))

	// True if the comment starts with '/**' but not if it is '/**/'
	return commentRanges.filter(
		(comment) =>
			text.charCodeAt(comment.pos + 1) ===
				0x2a /* ts.CharacterCodes.asterisk */ &&
			text.charCodeAt(comment.pos + 2) ===
				0x2a /* ts.CharacterCodes.asterisk */ &&
			text.charCodeAt(comment.pos + 3) !== 0x2f /* ts.CharacterCodes.slash */,
	)
}

interface Kit {
	compilerNode: TS.Node
	textRange: tsdoc.TextRange
	properties?: Map<string, Kit>
}

function walkCompilerAstAndFindComments(
	node: TS.Node,
	indent: string,
	packageExports: Map<string, Kit>,
	isNested = false,
): void {
	// The TypeScript AST doesn't store code comments directly.  If you want to find *every* comment,
	// you would need to rescan the SourceFile tokens similar to how tsutils.forEachComment() works:
	// https://github.com/ajafff/tsutils/blob/v3.0.0/util/util.ts#L453
	//
	// However, for this demo we are modeling a tool that discovers declarations and then analyzes their doc comments,
	// so we only care about TSDoc that would conventionally be associated with an interesting AST node.

	let foundCommentsSuffix = ``
	const buffer: string = node.getSourceFile().getFullText() // don't use getText() here!

	// Only consider nodes that are part of a declaration form.  Without this, we could discover
	// the same comment twice (e.g. for a MethodDeclaration and its PublicKeyword).
	if (isDeclarationKind(node.kind)) {
		const possibleExport: TS.Node | undefined = node.getFirstToken()
		const isExported = possibleExport?.kind === TS.SyntaxKind.ExportKeyword

		if (isExported || isNested) {
			// Find "/** */" style comments associated with this node.
			// Note that this reinvokes the compiler's scanner -- the result is not cached.
			const comments: TS.CommentRange[] = getJSDocCommentRanges(node, buffer)

			if (comments.length > 0) {
				if (comments.length === 1) {
					foundCommentsSuffix = colors.cyan(`  (FOUND 1 COMMENT)`)
				} else {
					foundCommentsSuffix = colors.cyan(
						`  (FOUND ${comments.length} COMMENTS)`,
					)
				}
			}
			console.log(`${indent}- ${TS.SyntaxKind[node.kind]}${foundCommentsSuffix}`)

			const name =
				// @ts-expect-error TS is not smart enough to know that node.name is a TS.Identifier
				`name` in node && TS.isIdentifier(node.name) ? node.name.text : null
			console.log(
				colors.cyan(`${indent}^ ${name} `) +
					colors.magenta(`(${isExported ? `EXPORTED` : `NESTED`})`),
			)

			if (name) {
				for (const comment of comments) {
					const packageExport = {
						compilerNode: node,
						textRange: tsdoc.TextRange.fromStringRange(
							buffer,
							comment.pos,
							comment.end,
						),
					}
					if (node.kind === TS.SyntaxKind.ClassDeclaration) {
						const members = new Map<string, Kit>()
						Object.assign(packageExport, { members })
						node.forEachChild((child) => {
							walkCompilerAstAndFindComments(child, indent + `  `, members, true)
						})
					}
					packageExports.set(name, packageExport)
				}
			}
		}
	}
	if (node.kind === TS.SyntaxKind.SourceFile) {
		node.forEachChild((child) => {
			walkCompilerAstAndFindComments(child, indent + `  `, packageExports)
		})
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
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

	export type FunctionDoc = Flat<
		DocContent & {
			type: `function`
			params: ParamBlock[]
		}
	>

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
			members: Doc[]
		}
	>

	export type Doc = AtomicDoc | CompositeDoc | FunctionDoc
}

function makeParagraph(node: tsdoc.DocNode): TSD.Paragraph {
	console.log(colors.blue(` Paragraph`))
	const paragraph: TSD.Paragraph = {
		type: `paragraph`,
		content: [],
	}
	for (const paragraphChild of node.getChildNodes()) {
		console.log(`  ` + paragraphChild.kind)
		switch (paragraphChild.kind) {
			case `PlainText`:
				console.log(colors.blue(`  PlainText`))
				for (const textChild of paragraphChild.getChildNodes()) {
					if (textChild instanceof tsdoc.DocExcerpt) {
						const text: string = textChild.content.toString()
						paragraph.content.push({
							type: `plainText`,
							text,
						})
					}
				}
				break
			case `LinkTag`:
				for (const linkChild of paragraphChild.getChildNodes()) {
					console.log(`  ` + linkChild.kind)
					if (linkChild.kind === `DeclarationReference`) {
						let excerpt: tsdoc.DocExcerpt | undefined
						console.log(colors.blue(`   DeclarationReference`))

						let currentNode = linkChild
						while (!excerpt) {
							if (currentNode instanceof tsdoc.DocExcerpt) {
								excerpt = currentNode
							} else {
								currentNode = currentNode.getChildNodes()[0]
							}
						}

						const link: TSD.LinkTag = {
							type: `link`,
							linkType: `MemberIdentifier`,
							text: excerpt.content.toString(),
						}
						paragraph.content.push(link)
					}
				}
				break
			case `SoftBreak`:
				console.log(colors.blue(`  SoftBreak`))
				paragraph.content.push({
					type: `softBreak`,
				})
				break
		}
	}
	return paragraph
}

function documentFunction(
	base: TSD.DocContent,
	docComment: tsdoc.DocComment,
): TSD.Doc {
	const doc: TSD.FunctionDoc = Object.assign(base, {
		type: `function` as const,
		params: [],
	})
	for (const child of docComment.getChildNodes()) {
		console.log(child.kind)
		switch (child.kind) {
			case `Section`:
				{
					console.log(colors.blue(`Section`))
					const section: TSD.DocSection = {
						type: `section`,
						content: [],
					}
					doc.sections.push(section)
					for (const sectionChild of child.getChildNodes()) {
						console.log(` ` + sectionChild.kind)
						switch (sectionChild.kind) {
							case `Paragraph`: {
								const paragraph = makeParagraph(sectionChild)
								section.content.push(paragraph)
							}
						}
					}
				}
				break
			case `ParamCollection`:
				for (const paramChild of child.getChildNodes()) {
					console.log(` ` + paramChild.kind)
					if (paramChild.kind === `ParamBlock`) {
						console.log(colors.blue(` ParamBlock`))
						const param: TSD.ParamBlock = {
							type: `paramBlock`,
							name: `???`,
						}
						let nameSet = false
						for (const paramBlockChild of paramChild.getChildNodes()) {
							if (
								!nameSet &&
								paramBlockChild instanceof tsdoc.DocExcerpt &&
								paramBlockChild.excerptKind === `ParamBlock_ParameterName`
							) {
								console.log(colors.blue(`  ParamBlock_ParameterName`))
								param.name = paramBlockChild.content.toString()
								nameSet = true
							}
							if (paramBlockChild.kind === `Section`) {
								if (paramBlockChild.getChildNodes()[0]?.kind === `Paragraph`) {
									param.desc = makeParagraph(paramBlockChild.getChildNodes()[0])
								}
							}
						}
						doc.params.push(param)
					}
				}
				break
			case `Block`:
				{
					console.log(colors.blue(` Block`))
					const block: TSD.DocBlock = {
						type: `block`,
						name: `???`,
					}
					for (const blockChild of child.getChildNodes()) {
						console.log(` ` + blockChild.kind)
						switch (blockChild.kind) {
							case `BlockTag`:
								{
									console.log(colors.blue(`  BlockTag`))
									const blockTag = blockChild.getChildNodes()[0]
									if (blockTag instanceof tsdoc.DocExcerpt) {
										block.name = blockTag.content.toString()
									}
								}
								break
							case `Section`:
								{
									console.log(colors.blue(`  Section`))
									const paragraph = blockChild.getChildNodes()[0]
									const desc = makeParagraph(paragraph)
									block.desc = desc
								}
								break
						}
					}
					doc.blocks.push(block)
				}
				break
			case `BlockTag`:
				{
					console.log(colors.blue(` BlockTag`))
					const blockTag = child.getChildNodes()[0]
					if (blockTag instanceof tsdoc.DocExcerpt) {
						const tagName = blockTag.content.toString()
						doc.modifierTags.push(tagName)
					}
				}
				break
		}
	}
	return doc
}

function getTSDocJson(
	parser: tsdoc.TSDocParser,
	kit: Kit,
	name: string,
): TSD.Doc {
	const parserContext: tsdoc.ParserContext = parser.parseRange(kit.textRange)
	const docComment: tsdoc.DocComment = parserContext.docComment
	const docType = kit.compilerNode.kind
	const content: TSD.DocContent = {
		name,
		sections: [],
		modifierTags: [],
		blocks: [],
	}
	let doc: TSD.Doc
	switch (docType) {
		case TS.SyntaxKind.ClassDeclaration:
			console.log(`ClassDeclaration`)
			doc = Object.assign(content, {
				type: `composite` as const,
				kind: `class` as const,
				members: [],
			})
			break
		case TS.SyntaxKind.FunctionDeclaration:
			{
				console.log(`FunctionDeclaration`)
				doc = documentFunction(content, docComment)
			}

			break
		default:
			throw new Error(`Unknown doc type: ${TS.SyntaxKind[docType]}`)
	}
	return doc
}

function dumpTSDocTree(docNode: tsdoc.DocNode, indent: string): void {
	let dumpText = ``
	if (docNode instanceof tsdoc.DocExcerpt) {
		const content: string = docNode.content.toString()
		dumpText +=
			colors.gray(`${indent}* ${docNode.excerptKind}=`) +
			colors.cyan(JSON.stringify(content))
	} else {
		dumpText += `${indent}- ${docNode.kind}`
	}
	console.log(dumpText)

	for (const child of docNode.getChildNodes()) {
		dumpTSDocTree(child, indent + `  `)
	}
}

function parseTSDoc(foundComment: Kit): void {
	if (!foundComment.textRange) {
		console.log(
			os.EOL +
				colors.red(`Error: No code comments were found in the input file`) +
				os.EOL,
		)
		return
	}
	console.log(os.EOL + colors.green(`Comment to be parsed:`) + os.EOL)
	console.log(colors.gray(`<<<<<<`))
	console.log(foundComment.textRange.toString())
	console.log(colors.gray(`>>>>>>`))

	const customConfiguration: tsdoc.TSDocConfiguration =
		new tsdoc.TSDocConfiguration()

	const customInlineDefinition: tsdoc.TSDocTagDefinition =
		new tsdoc.TSDocTagDefinition({
			tagName: `@customInline`,
			syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
			allowMultiple: true,
		})

	// NOTE: Defining this causes a new DocBlock to be created under docComment.customBlocks.
	// Otherwise, a simple DocBlockTag would appear inline in the @remarks section.
	const customBlockDefinition: tsdoc.TSDocTagDefinition =
		new tsdoc.TSDocTagDefinition({
			tagName: `@customBlock`,
			syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
		})

	// NOTE: Defining this causes @customModifier to be removed from its section,
	// and added to the docComment.modifierTagSet
	const customModifierDefinition: tsdoc.TSDocTagDefinition =
		new tsdoc.TSDocTagDefinition({
			tagName: `@customModifier`,
			syntaxKind: tsdoc.TSDocTagSyntaxKind.ModifierTag,
		})

	customConfiguration.addTagDefinitions([
		customInlineDefinition,
		customBlockDefinition,
		customModifierDefinition,
	])

	console.log(
		os.EOL + `Invoking TSDocParser with custom configuration...` + os.EOL,
	)
	const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser(
		customConfiguration,
	)
	const parserContext: tsdoc.ParserContext = tsdocParser.parseRange(
		foundComment.textRange,
	)
	const docComment: tsdoc.DocComment = parserContext.docComment

	console.log(os.EOL + colors.green(`Parser Log Messages:`) + os.EOL)

	if (parserContext.log.messages.length === 0) {
		console.log(`No errors or warnings.`)
	} else {
		const sourceFile: TS.SourceFile = foundComment.compilerNode.getSourceFile()
		for (const message of parserContext.log.messages) {
			// Since we have the compiler's analysis, use it to calculate the line/column information,
			// since this is currently faster than TSDoc's TextRange.getLocation() lookup.
			const location: TS.LineAndCharacter =
				sourceFile.getLineAndCharacterOfPosition(message.textRange.pos)
			const formattedMessage = `${sourceFile.fileName}(${location.line + 1},${
				location.character + 1
			}): [TSDoc] ${message.toString()}`
			console.log(formattedMessage)
		}
	}

	if (parserContext.docComment.modifierTagSet.hasTag(customModifierDefinition)) {
		console.log(
			os.EOL +
				colors.cyan(
					`The ${customModifierDefinition.tagName} modifier was FOUND.`,
				),
		)
	} else {
		console.log(
			os.EOL +
				colors.cyan(
					`The ${customModifierDefinition.tagName} modifier was NOT FOUND.`,
				),
		)
	}

	console.log(os.EOL + colors.green(`Visiting TSDoc's DocNode tree`) + os.EOL)
	dumpTSDocTree(docComment, ``)
}

/**
 * The advanced demo invokes the TypeScript compiler and extracts the comment from the AST.
 * It also illustrates how to define custom TSDoc tags using TSDocConfiguration.
 */
export function advancedDemo(subPackageName: string): TSD.Doc[] {
	console.log(
		colors.yellow(`*** TSDoc API demo: Advanced Scenario ***`) + os.EOL,
	)

	const inputFilename: string = path.resolve(
		path.join(__dirname, `..`, subPackageName, `src`, `index.ts`),
	)
	const compilerOptions: TS.CompilerOptions = {
		module: TS.ModuleKind.Preserve,
		lib: [`DOM`, `es2023`, `ES2023.Array`],
		moduleResolution: TS.ModuleResolutionKind.Bundler,
		target: TS.ScriptTarget.ES2017,
		paths: {
			"~/*": [`../../*`],
			"atom.io": [`./src`],
			"atom.io/*": [`./*/src`],
			rel8: [`../rel8/types/src`],
			"rel8/*": [`../rel8/*/src`],
		},
		jsx: TS.JsxEmit.ReactJSX,
		jsxImportSource: `react`,
		noEmit: true,
		declaration: true,
		include: [
			`src`,
			`**/src`,
			`__tests__`,
			`__scripts__`,
			`__unstable__`,
			`**/*.config.ts`,
		],
		forceConsistentCasingInFileNames: true,
		strictNullChecks: true,
		exactOptionalPropertyTypes: true,
		useUnknownInCatchVariables: true,
	}

	// Compile the input
	console.log(
		`Invoking the TypeScript compiler to analyze ${path.join(
			`atom.io`,
			subPackageName,
			`src`,
			`index.ts`,
		)}...`,
	)

	const program: TS.Program = TS.createProgram([inputFilename], compilerOptions)

	// Report any compiler errors
	const compilerDiagnostics: ReadonlyArray<TS.Diagnostic> =
		program.getSemanticDiagnostics()
	if (compilerDiagnostics.length > 0) {
		for (const diagnostic of compilerDiagnostics) {
			const message: string = TS.flattenDiagnosticMessageText(
				diagnostic.messageText,
				os.EOL,
			)
			if (diagnostic.file) {
				const location: TS.LineAndCharacter =
					// biome-ignore lint/style/noNonNullAssertion: The compiler is not null-safe.
					diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
				const formattedMessage: string =
					`${diagnostic.file.fileName}(${location.line + 1},${
						location.character + 1
					}):` + ` [TypeScript] ${message}`
				console.log(colors.red(formattedMessage))
			} else {
				console.log(colors.red(message))
			}
		}
	} else {
		console.log(`No compiler errors or warnings.`)
	}

	const sourceFile: TS.SourceFile | undefined =
		program.getSourceFile(inputFilename)
	if (!sourceFile) {
		throw new Error(`Error retrieving source file`)
	}

	console.log(
		os.EOL +
			colors.green(`Scanning compiler AST for first code comment...`) +
			os.EOL,
	)

	const foundComments = new Map<string, Kit>()

	walkCompilerAstAndFindComments(sourceFile, ``, foundComments)
	const subPackageSourceFilenames = program
		.getSourceFiles()
		.map((f) => f.fileName)
		.filter(
			(f) =>
				f.includes(path.join(`atom.io`, subPackageName)) &&
				!f.includes(path.join(`atom.io`, subPackageName, `src/index.ts`)),
		)

	console.log(
		os.EOL +
			colors.cyan(`Files Found:`) +
			os.EOL +
			` - ` +
			subPackageSourceFilenames.join(os.EOL + ` - `) +
			os.EOL,
	)

	for (const subPackageSourceFilename of subPackageSourceFilenames) {
		const subPackageSourceFile: TS.SourceFile | undefined =
			program.getSourceFile(subPackageSourceFilename)
		if (!subPackageSourceFile) {
			throw new Error(`Error retrieving source file`)
		}
		walkCompilerAstAndFindComments(subPackageSourceFile, ``, foundComments)
	}

	if (foundComments.size === 0) {
		throw new Error(`No code comments were found in the input file`)
	}
	// For the purposes of this demo, only analyze the first comment that we found
	// parseTSDoc(foundComments[0])
	for (const value of [...foundComments.values()]) {
		parseTSDoc(value)
		if (value.properties) {
			for (const member of value.properties.values()) {
				parseTSDoc(member)
			}
		}
		break
	}
	console.log(foundComments.keys())
	const parser = new tsdoc.TSDocParser()
	const jsonDocs: TSD.Doc[] = []
	for (const [key, value] of foundComments) {
		jsonDocs.push(getTSDocJson(parser, value, key))
	}
	return jsonDocs
}
