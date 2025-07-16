/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import * as os from "node:os"
import * as path from "node:path"

import * as tsdoc from "@microsoft/tsdoc"
import colors from "colors"
import TS from "typescript"

import type { TSD } from "./namespace"

export type { TSD }

const DEBUG_LOGGING = false

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
		kind === TS.SyntaxKind.CallSignature || // 😈
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

export const CONSTRUCTOR_BRAND = `%CONSTRUCTOR%`
export const CALL_SIGNATURE_BRAND = `%CALL_SIGNATURE%`
function nameNode(node: TS.Node): string {
	let name: string | null = null
	if (`name` in node) {
		const nodeName = node.name as TS.Node
		if (TS.isIdentifier(nodeName)) {
			name = nodeName.getText()
		}
		if (nodeName.kind === TS.SyntaxKind.ComputedPropertyName) {
			name = nodeName.getText()
		}
	}
	switch (node.kind) {
		case TS.SyntaxKind.CallSignature:
			name = CALL_SIGNATURE_BRAND
			break
		case TS.SyntaxKind.Constructor:
			name = CONSTRUCTOR_BRAND
			break
	}
	if (name === null) {
		throw new Error(`Could not find name for node`)
	}
	return name
}

export interface DiscoveredResource {
	compilerNode: TS.Node
	textRange?: tsdoc.TextRange
	properties?: Map<string, DiscoveredResource | DiscoveredResource[]>
}

function walkCompilerAstAndDiscoverResources(
	node: TS.Node,
	indent: string,
	packageExports: Map<string, DiscoveredResource | DiscoveredResource[]>,
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

			switch (comments.length) {
				case 0:
					foundCommentsSuffix = colors.cyan(`  (NO COMMENTS)`)
					break
				case 1:
					foundCommentsSuffix = colors.cyan(`  (FOUND 1 COMMENT)`)
					break
				default:
					foundCommentsSuffix = colors.cyan(
						`  (FOUND ${comments.length} COMMENTS)`,
					)
					break
			}
			if (DEBUG_LOGGING) {
				console.log(
					`${indent}- ${TS.SyntaxKind[node.kind]}${foundCommentsSuffix}`,
				)
			}
			const name = nameNode(node)
			if (DEBUG_LOGGING) {
				console.log(
					colors.cyan(`${indent}^ ${name} `) +
						colors.magenta(`(${isNested ? `NESTED` : `EXPORTED`})`),
				)
			}

			const comment = comments.at(0)
			const packageExport: DiscoveredResource = {
				compilerNode: node,
			}
			if (comment) {
				packageExport.textRange = tsdoc.TextRange.fromStringRange(
					buffer,
					comment.pos,
					comment.end,
				)
			}
			switch (node.kind) {
				case TS.SyntaxKind.TypeAliasDeclaration:
					{
						const typeAlias = node
							.getChildren()
							.find((child) => child.kind === TS.SyntaxKind.TypeLiteral)

						const syntaxList = typeAlias
							?.getChildren()
							.find((child) => child.kind === TS.SyntaxKind.SyntaxList)

						const propertySignatures = syntaxList
							?.getChildren()
							.filter((child) => child.kind === TS.SyntaxKind.PropertySignature)
						if (propertySignatures) {
							const properties = new Map<string, DiscoveredResource>()
							Object.assign(packageExport, { properties })
							for (const propertySignature of propertySignatures) {
								walkCompilerAstAndDiscoverResources(
									propertySignature,
									indent + `  `,
									properties,
									true,
								)
							}
						}
					}
					break
				case TS.SyntaxKind.InterfaceDeclaration:
				case TS.SyntaxKind.ClassDeclaration:
					{
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
					break
				case TS.SyntaxKind.PropertySignature:
				case TS.SyntaxKind.PropertyDeclaration: {
					const typeLiteral = node
						.getChildren()
						.find((child) => child.kind === TS.SyntaxKind.TypeLiteral)
					// console.log(
					// 	`😽 TypeLiteral -`,
					// 	typeLiteral?.getFullText(),
					// 	`\n\tcontains ${typeLiteral
					// 		?.getChildren()
					// 		.map((c) => TS.SyntaxKind[c.kind])
					// 		.join(`, `)}`,
					// )
					const syntaxList = typeLiteral
						?.getChildren()
						.find((child) => child.kind === TS.SyntaxKind.SyntaxList)

					const propertySignatures = syntaxList
						?.getChildren()
						.filter((child) => child.kind === TS.SyntaxKind.PropertySignature)
					if (propertySignatures) {
						const properties = new Map<string, DiscoveredResource>()
						Object.assign(packageExport, { properties })
						for (const propertySignature of propertySignatures) {
							walkCompilerAstAndDiscoverResources(
								propertySignature,
								indent + `  `,
								properties,
								true,
							)
						}
					}
				}
			}
			const existing = packageExports.get(name)
			if (existing) {
				if (Array.isArray(existing)) {
					existing.push(packageExport)
				} else {
					packageExports.set(name, [existing, packageExport])
				}
			} else {
				packageExports.set(name, packageExport)
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
	if (DEBUG_LOGGING) console.log(colors.blue(` Paragraph`))
	const paragraph: TSD.Paragraph = {
		type: `paragraph`,
		content: [],
	}
	for (const paragraphChild of node.getChildNodes()) {
		if (DEBUG_LOGGING) console.log(`  ` + paragraphChild.kind)
		switch (paragraphChild.kind) {
			case `PlainText`:
				if (DEBUG_LOGGING) console.log(colors.blue(`  PlainText`))
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
					if (DEBUG_LOGGING) console.log(`  ` + linkChild.kind)
					if (linkChild.kind === `DeclarationReference`) {
						let excerpt: tsdoc.DocExcerpt | undefined
						if (DEBUG_LOGGING)
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
				if (DEBUG_LOGGING) console.log(colors.blue(`  SoftBreak`))
				paragraph.content.push({
					type: `softBreak`,
				})
				break
		}
	}
	return paragraph
}

function makeDocSection(docNode: tsdoc.DocNode): TSD.DocSection {
	if (DEBUG_LOGGING) console.log(colors.blue(`Section`))
	const section: TSD.DocSection = {
		type: `section`,
		content: [],
	}
	for (const sectionChild of docNode.getChildNodes()) {
		if (DEBUG_LOGGING) console.log(` ` + sectionChild.kind)
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
	if (DEBUG_LOGGING) console.log(colors.blue(` ParamBlock`))
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
			if (DEBUG_LOGGING) console.log(colors.blue(`  ParamBlock_ParameterName`))
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
	if (DEBUG_LOGGING) console.log(colors.blue(` Block`))
	const block: TSD.DocBlock = {
		type: `block`,
		name: `???`,
	}
	for (const blockChild of docBlockNode.getChildNodes()) {
		if (DEBUG_LOGGING) console.log(` ` + blockChild.kind)
		switch (blockChild.kind) {
			case `BlockTag`:
				{
					if (DEBUG_LOGGING) console.log(colors.blue(`  BlockTag`))
					const blockTag = blockChild.getChildNodes()[0]
					if (blockTag instanceof tsdoc.DocExcerpt) {
						block.name = blockTag.content.toString()
					}
				}
				break
			case `Section`:
				{
					if (DEBUG_LOGGING) console.log(colors.blue(`  Section`))
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
	if (DEBUG_LOGGING) console.log(colors.blue(` BlockTag`))
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
	name: string,
	comment?: tsdoc.DocComment,
): TSD.FunctionDoc {
	const doc: TSD.FunctionDoc = {
		name,
		type: `function` as const,
		kind: `regular` as const,
		params: [],
		sections: [],
		modifierTags: [],
		blocks: [],
	}
	if (comment) {
		for (const child of comment.getChildNodes()) {
			if (DEBUG_LOGGING) console.log(child.kind)
			switch (child.kind) {
				case `ParamCollection`:
					for (const paramChild of child.getChildNodes()) {
						if (DEBUG_LOGGING) console.log(` ` + paramChild.kind)
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
	}
	return doc
}

function documentAtomicResource(
	name: string,
	kind: TSD.AtomicEntity,
	comment?: tsdoc.DocComment,
): TSD.AtomicDoc {
	const doc: TSD.AtomicDoc = {
		name,
		type: `atomic` as const,
		kind,
		sections: [],
		modifierTags: [],
		blocks: [],
	}
	if (comment) {
		for (const child of comment.getChildNodes()) {
			if (DEBUG_LOGGING) console.log(child.kind)
			documentGeneralContent(doc, child)
		}
	}
	return doc
}
function documentCompositeResource(
	name: string,
	kind: TSD.CompositeEntity,
	comment?: tsdoc.DocComment,
): TSD.CompositeDoc {
	const doc: TSD.CompositeDoc = {
		name,
		type: `composite` as const,
		kind,
		sections: [],
		modifierTags: [],
		blocks: [],
		properties: [],
	}
	if (comment) {
		for (const child of comment.getChildNodes()) {
			if (DEBUG_LOGGING) console.log(child.kind)
			documentGeneralContent(doc, child)
		}
	}
	return doc
}

function assembleJsonDocForResource(
	parser: tsdoc.TSDocParser,
	resourceName: string,
	resources: DiscoveredResource | DiscoveredResource[],
): TSD.Doc {
	let doc: TSD.Doc
	const isOverload = Array.isArray(resources)
	if (isOverload) {
		const kind = resources[0].compilerNode.kind
		const isCallable =
			kind === TS.SyntaxKind.CallSignature ||
			kind === TS.SyntaxKind.FunctionDeclaration ||
			kind === TS.SyntaxKind.MethodDeclaration
		const allFunctions = resources.every(
			(resource) => resource.compilerNode.kind === kind,
		)
		if (!allFunctions || !isCallable) {
			throw new Error(
				`Absurd: Expected all resources to be functions, but got ${resources
					.map((resource) => resource.compilerNode.kind)
					.join(`, `)}`,
			)
		}
		doc = {
			type: `function` as const,
			kind: `overloaded` as const,
			name: resourceName,
			overloads: [],
		}
		for (const resource of resources) {
			const signatureDoc = assembleJsonDocForResource(
				parser,
				resourceName,
				resource,
			) as TSD.RegularFunctionDoc
			doc.overloads.push(signatureDoc)
		}
	} else {
		const resource = resources
		let comment: tsdoc.DocComment | undefined
		if (resource.textRange) {
			comment = parser.parseRange(resource.textRange).docComment
		}

		const docType = resource.compilerNode.kind
		if (DEBUG_LOGGING)
			console.log(
				TS.SyntaxKind[docType],
				`"${resourceName}"`,
				`properties: ${resource.properties ? `[${[...resource.properties.keys()].join(`, `)}]` : `none`}`,
			)

		switch (docType) {
			case TS.SyntaxKind.CallSignature:
			case TS.SyntaxKind.Constructor:
			case TS.SyntaxKind.FunctionDeclaration:
			case TS.SyntaxKind.MethodDeclaration:
				doc = documentFunction(resourceName, comment)
				break

			case TS.SyntaxKind.ClassDeclaration:
				doc = documentCompositeResource(resourceName, `class`, comment)
				break

			case TS.SyntaxKind.InterfaceDeclaration:
				doc = documentCompositeResource(resourceName, `interface`, comment)
				break

			case TS.SyntaxKind.PropertyDeclaration:
			case TS.SyntaxKind.PropertySignature:
			case TS.SyntaxKind.TypeAliasDeclaration:
				if (resource.properties) {
					doc = documentCompositeResource(resourceName, `type`, comment)
				} else {
					doc = documentAtomicResource(resourceName, `type`, comment)
				}
				break

			case TS.SyntaxKind.TypeParameter:
				doc = documentAtomicResource(resourceName, `type`, comment)
				break

			default:
				throw new Error(`Unknown doc type: ${TS.SyntaxKind[docType]}`)
		}
		if (resource.properties && doc.type === `composite`) {
			for (const [pKey, pVal] of resource.properties) {
				const pDoc = assembleJsonDocForResource(parser, pKey, pVal)
				doc.properties.push(pDoc)
			}
		}
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

	const discoveredResources = new Map<
		string,
		DiscoveredResource | DiscoveredResource[]
	>()

	walkCompilerAstAndDiscoverResources(sourceFile, ``, discoveredResources)
	const subPackageSourceFilenames = program
		.getSourceFiles()
		.map((f) => f.fileName)
		.filter(
			(f) =>
				f.includes(path.join(options.entrypoint, `..`)) &&
				!f.includes(options.entrypoint),
		)

	if (DEBUG_LOGGING) {
		console.log(
			os.EOL +
				colors.cyan(`Files Found:`) +
				os.EOL +
				` - ` +
				subPackageSourceFilenames.join(os.EOL + ` - `) +
				os.EOL,
		)
	}

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
		jsonDocs.push(assembleJsonDocForResource(parser, key, value))
	}
	return jsonDocs
}
