import * as os from "node:os"
import * as path from "node:path"

import * as tsdoc from "@microsoft/tsdoc"
import colors from "colors"
import TS from "typescript"

import type { TSD } from "./namespace"
export type { TSD }

function isExported(node: TS.Node): node is TS.Node & { $__exported?: boolean } {
	const possibleExport: TS.Node | undefined = node.getFirstToken()
	return possibleExport?.kind === TS.SyntaxKind.ExportKeyword
}

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

export interface DiscoveredResource {
	compilerNode: TS.Node
	textRange: tsdoc.TextRange
	properties?: Map<string, DiscoveredResource>
}

function walkCompilerAstAndDiscoverResources(
	node: TS.Node,
	indent: string,
	packageExports: Map<string, DiscoveredResource>,
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
		if (isNested || isExported(node)) {
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
					colors.magenta(`(${isNested ? `NESTED` : `EXPORTED`})`),
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
					switch (node.kind) {
						case TS.SyntaxKind.InterfaceDeclaration:
						case TS.SyntaxKind.VariableDeclaration:
						case TS.SyntaxKind.TypeAliasDeclaration:
						case TS.SyntaxKind.ClassDeclaration: {
							const properties = new Map<string, DiscoveredResource>()
							Object.assign(packageExport, { properties })
							node.forEachChild((child) => {
								walkCompilerAstAndDiscoverResources(
									child,
									indent + `  `,
									properties,
									true,
								)
							})
						}
					}
					packageExports.set(name, packageExport)
				}
			}
		}
	}
	if (node.kind === TS.SyntaxKind.SourceFile) {
		node.forEachChild((child) => {
			walkCompilerAstAndDiscoverResources(child, indent + `  `, packageExports)
		})
	}
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
						const text = textChild.content.toString().trim()
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

function makeDocSection(docNode: tsdoc.DocNode): TSD.DocSection {
	console.log(colors.blue(`Section`))
	const section: TSD.DocSection = {
		type: `section`,
		content: [],
	}
	for (const sectionChild of docNode.getChildNodes()) {
		console.log(` ` + sectionChild.kind)
		switch (sectionChild.kind) {
			case `Paragraph`: {
				const paragraph = makeParagraph(sectionChild)
				section.content.push(paragraph)
			}
		}
	}
	return section
}

function makeFunctionDocParameter(
	paramBlockNode: tsdoc.DocNode,
): TSD.ParamBlock {
	console.log(colors.blue(` ParamBlock`))
	const param: TSD.ParamBlock = {
		type: `paramBlock`,
		name: `???`,
	}
	let nameSet = false
	for (const paramBlockChild of paramBlockNode.getChildNodes()) {
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
	return param
}

function makeDocBlock(docBlockNode: tsdoc.DocNode): TSD.DocBlock {
	console.log(colors.blue(` Block`))
	const block: TSD.DocBlock = {
		type: `block`,
		name: `???`,
	}
	for (const blockChild of docBlockNode.getChildNodes()) {
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
	return block
}

function makeModifierTag(modifierTagNode: tsdoc.DocNode): string | undefined {
	console.log(colors.blue(` BlockTag`))
	const blockTag = modifierTagNode.getChildNodes()[0]
	if (blockTag instanceof tsdoc.DocExcerpt) {
		const tagName = blockTag.content.toString()
		return tagName
	}
}

function documentGeneralContent(
	content: TSD.DocContent,
	docNode: tsdoc.DocNode,
): void {
	switch (docNode.kind) {
		case `Section`:
			{
				const section = makeDocSection(docNode)
				content.sections.push(section)
			}
			break
		case `Block`:
			{
				const block = makeDocBlock(docNode)
				content.blocks.push(block)
			}
			break
		case `BlockTag`:
			{
				const tagName = makeModifierTag(docNode)
				if (tagName) {
					content.modifierTags.push(tagName)
				}
			}
			break
	}
}

function documentFunction(
	base: TSD.DocContent,
	docComment: tsdoc.DocComment,
): TSD.FunctionDoc {
	const doc: TSD.FunctionDoc = Object.assign(base, {
		type: `function` as const,
		params: [],
	})
	for (const child of docComment.getChildNodes()) {
		console.log(child.kind)
		switch (child.kind) {
			case `ParamCollection`:
				for (const paramChild of child.getChildNodes()) {
					console.log(` ` + paramChild.kind)
					if (paramChild.kind === `ParamBlock`) {
						const param = makeFunctionDocParameter(paramChild)
						doc.params.push(param)
					}
				}
				break
			default:
				documentGeneralContent(doc, child)
		}
	}
	return doc
}

function documentCompositeResource(
	content: TSD.DocContent,
	docComment: tsdoc.DocComment,
	kind: TSD.CompositeEntity,
): TSD.CompositeDoc {
	const doc: TSD.CompositeDoc = Object.assign(content, {
		type: `composite` as const,
		kind,
		properties: [],
	})
	for (const child of docComment.getChildNodes()) {
		console.log(child.kind)
		documentGeneralContent(doc, child)
	}
	return doc
}

function assembleJsonDocForResource(
	parser: tsdoc.TSDocParser,
	resource: DiscoveredResource,
	name: string,
): TSD.Doc {
	const parserContext = parser.parseRange(resource.textRange)
	const docComment = parserContext.docComment
	const docType = resource.compilerNode.kind
	const content: TSD.DocContent = {
		name,
		sections: [],
		modifierTags: [],
		blocks: [],
	}

	let doc: TSD.Doc
	switch (docType) {
		case TS.SyntaxKind.ClassDeclaration:
			console.log(TS.SyntaxKind[docType])
			doc = documentCompositeResource(content, docComment, `class`)
			if (resource.properties) {
				for (const [pKey, pVal] of resource.properties) {
					const pDoc = assembleJsonDocForResource(parser, pVal, pKey)
					doc.properties.push(pDoc)
				}
			}

			break
		case TS.SyntaxKind.FunctionDeclaration:
		case TS.SyntaxKind.MethodDeclaration:
			console.log(TS.SyntaxKind[docType])
			doc = documentFunction(content, docComment)
			break
		case TS.SyntaxKind.PropertyDeclaration:
			{
				console.log(TS.SyntaxKind[docType], Object.keys(resource.compilerNode))
				console.log(
					resource.compilerNode.getChildren().map((c) => TS.SyntaxKind[c.kind]),
				)
				// const propertyIsComposite = resource.compilerNode.getC
			}
			break
		default:
			throw new Error(`Unknown doc type: ${TS.SyntaxKind[docType]}`)
	}
	return doc
}

export function createCustomConfiguration(): tsdoc.TSDocConfiguration {
	const customConfiguration = new tsdoc.TSDocConfiguration()
	customConfiguration.addTagDefinitions([
		new tsdoc.TSDocTagDefinition({
			tagName: `@overload`,
			syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
		}),
	])
	return customConfiguration
}

export type CompileDocsOptions = {
	entrypoint: string
	tsconfigPath: string
}
export function compileDocs(options: CompileDocsOptions): TSD.Doc[] {
	console.log(colors.yellow(`*** Compiling Docs ***`) + os.EOL, options)

	const configFile = TS.readConfigFile(options.tsconfigPath, TS.sys.readFile)

	if (configFile.error) {
		throw new Error(
			TS.formatDiagnosticsWithColorAndContext([configFile.error], {
				getCurrentDirectory: TS.sys.getCurrentDirectory,
				getNewLine: () => TS.sys.newLine,
				getCanonicalFileName: (fileName: string) => fileName,
			}),
		)
	}

	const parsedConfig = TS.parseJsonConfigFileContent(
		configFile.config,
		TS.sys,
		path.dirname(options.tsconfigPath),
	)
	const compilerOptions: TS.CompilerOptions = parsedConfig.options

	// Compile the input
	console.log(`Invoking TSC to analyze ${options.entrypoint}...`)

	const program: TS.Program = TS.createProgram(
		[options.entrypoint],
		compilerOptions,
	)

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

	const sourceFile: TS.SourceFile | undefined = program.getSourceFile(
		options.entrypoint,
	)
	if (!sourceFile) {
		throw new Error(`Error retrieving source file`)
	}

	console.log(
		os.EOL +
			colors.green(`Scanning compiler AST for first code comment...`) +
			os.EOL,
	)

	const discoveredResources = new Map<string, DiscoveredResource>()

	walkCompilerAstAndDiscoverResources(sourceFile, ``, discoveredResources)
	const subPackageSourceFilenames = program
		.getSourceFiles()
		.map((f) => f.fileName)
		.filter(
			(f) =>
				f.includes(path.join(options.entrypoint, `..`)) &&
				!f.includes(options.entrypoint),
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
		walkCompilerAstAndDiscoverResources(
			subPackageSourceFile,
			``,
			discoveredResources,
		)
	}

	const customConfiguration = createCustomConfiguration()
	const parser = new tsdoc.TSDocParser(customConfiguration)
	const jsonDocs: TSD.Doc[] = []
	for (const [key, value] of discoveredResources) {
		jsonDocs.push(assembleJsonDocForResource(parser, value, key))
	}
	return jsonDocs
}
