import * as os from "node:os"

import * as tsdoc from "@microsoft/tsdoc"
import colors from "colors"
import type TS from "typescript"

import type { DiscoveredResource } from "./library"

export function logResources(
	discoveredResources: Map<string, DiscoveredResource>,
): void {
	if (discoveredResources.size === 0) {
		throw new Error(`No code comments were found in the input file`)
	}

	for (const value of [...discoveredResources.values()]) {
		parseTSDoc(value)
		if (value.properties) {
			for (const member of value.properties.values()) {
				parseTSDoc(member)
			}
		}
		break
	}
	console.log(discoveredResources.keys())
}

function parseTSDoc(foundComment: DiscoveredResource): void {
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
	const overloadBlockDefinition: tsdoc.TSDocTagDefinition =
		new tsdoc.TSDocTagDefinition({
			tagName: `@overload`,
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
		overloadBlockDefinition,
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

	const childNodes = docNode.getChildNodes()

	for (const child of childNodes) {
		dumpTSDocTree(child, indent + `  `)
	}
}
